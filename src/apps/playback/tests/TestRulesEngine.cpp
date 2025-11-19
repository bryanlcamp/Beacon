#include <gtest/gtest.h>
#include <memory>
#include "../src/authorities/RulesEngine.h"
#include "../PlaybackState.h"

using namespace playback::rules;

// Mock rule for testing
class MockPlaybackRule : public IPlaybackRule {
private:
    Priority _priority;
    Outcome _outcome;
    std::chrono::microseconds _delay;
    
public:
    MockPlaybackRule(Priority priority, Outcome outcome, std::chrono::microseconds delay = std::chrono::microseconds(0))
        : _priority(priority), _outcome(outcome), _delay(delay) {}
    
    Priority getPriority() const override { return _priority; }
    
    Decision apply(size_t messageIndex, const char* message, const PlaybackState& state, Decision currentDecision) override {
        Decision decision = currentDecision;
        decision.outcome = _outcome;
        decision.accumulatedDelay += _delay;
        return decision;
    }
    
    void initialize() override {}
    void onPlaybackStart() override {}
    void onPlaybackEnd() override {}
};

class TestRulesEngine : public ::testing::Test {
protected:
    void SetUp() override {
        state.setCurrentMessageIndex(0);
        state.initialize(100);
        state.start();
    }
    
    PlaybackState state;
    const char* testMessage = "Test message data";
};

TEST_F(TestRulesEngine, EmptyRulesEngine) {
    RulesEngine engine;
    
    EXPECT_EQ(engine.getRuleCount(), 0);
    
    // Evaluate with no rules should return CONTINUE
    auto decision = engine.evaluate(0, testMessage, state);
    EXPECT_EQ(decision.outcome, Outcome::CONTINUE);
    EXPECT_EQ(decision.accumulatedDelay.count(), 0);
}

TEST_F(TestRulesEngine, AddSingleRule) {
    RulesEngine engine;
    
    auto rule = std::make_unique<MockPlaybackRule>(Priority::CONTROL, Outcome::CONTINUE, std::chrono::microseconds(100));
    engine.addRule(std::move(rule));
    
    EXPECT_EQ(engine.getRuleCount(), 1);
}

TEST_F(TestRulesEngine, RulePriorityOrdering) {
    RulesEngine engine;
    
    // Add rules in mixed priority order
    engine.addRule(std::make_unique<MockPlaybackRule>(Priority::CHAOS, Outcome::CONTINUE));    // Lowest priority
    engine.addRule(std::make_unique<MockPlaybackRule>(Priority::SAFETY, Outcome::CONTINUE));   // Highest priority  
    engine.addRule(std::make_unique<MockPlaybackRule>(Priority::TIMING, Outcome::CONTINUE));   // Medium priority
    engine.addRule(std::make_unique<MockPlaybackRule>(Priority::CONTROL, Outcome::CONTINUE));  // Medium priority
    
    EXPECT_EQ(engine.getRuleCount(), 4);
    
    // Rules should be evaluated in priority order (SAFETY -> CONTROL -> TIMING -> CHAOS)
    auto decision = engine.evaluate(0, testMessage, state);
    EXPECT_EQ(decision.outcome, Outcome::CONTINUE);
}

TEST_F(TestRulesEngine, RuleVetoShortCircuits) {
    RulesEngine engine;
    
    // Add rules where first (highest priority) rule vetoes
    engine.addRule(std::make_unique<MockPlaybackRule>(Priority::SAFETY, Outcome::VETO));
    engine.addRule(std::make_unique<MockPlaybackRule>(Priority::CONTROL, Outcome::CONTINUE, std::chrono::microseconds(500)));
    
    auto decision = engine.evaluate(0, testMessage, state);
    
    // Should stop at VETO, not accumulate delay from second rule
    EXPECT_EQ(decision.outcome, Outcome::VETO);
    EXPECT_EQ(decision.accumulatedDelay.count(), 0);
}

TEST_F(TestRulesEngine, RuleDropShortCircuits) {
    RulesEngine engine;
    
    // Add rules where first rule drops message
    engine.addRule(std::make_unique<MockPlaybackRule>(Priority::CONTROL, Outcome::DROP));
    engine.addRule(std::make_unique<MockPlaybackRule>(Priority::TIMING, Outcome::CONTINUE, std::chrono::microseconds(1000)));
    
    auto decision = engine.evaluate(0, testMessage, state);
    
    // Should stop at DROP
    EXPECT_EQ(decision.outcome, Outcome::DROP);
    EXPECT_EQ(decision.accumulatedDelay.count(), 0);
}

TEST_F(TestRulesEngine, DelayAccumulation) {
    RulesEngine engine;
    
    // Add rules that accumulate delays
    engine.addRule(std::make_unique<MockPlaybackRule>(Priority::CONTROL, Outcome::CONTINUE, std::chrono::microseconds(100)));
    engine.addRule(std::make_unique<MockPlaybackRule>(Priority::TIMING, Outcome::CONTINUE, std::chrono::microseconds(200)));
    engine.addRule(std::make_unique<MockPlaybackRule>(Priority::CHAOS, Outcome::CONTINUE, std::chrono::microseconds(300)));
    
    auto decision = engine.evaluate(0, testMessage, state);
    
    EXPECT_EQ(decision.outcome, Outcome::CONTINUE);
    EXPECT_EQ(decision.accumulatedDelay.count(), 600); // 100 + 200 + 300
}

TEST_F(TestRulesEngine, PlaybackLifecycleNotifications) {
    RulesEngine engine;
    
    // Mock rule to track lifecycle calls
    class LifecycleMockRule : public IPlaybackRule {
    public:
        mutable bool initializeCalled = false;
        mutable bool startCalled = false;
        mutable bool endCalled = false;
        
        Priority getPriority() const override { return Priority::CONTROL; }
        
        Decision apply(size_t, const char*, const PlaybackState&, Decision current) override {
            return current;
        }
        
        void initialize() override { initializeCalled = true; }
        void onPlaybackStart() override { startCalled = true; }
        void onPlaybackEnd() override { endCalled = true; }
    };
    
    auto* rulePtr = new LifecycleMockRule();
    engine.addRule(std::unique_ptr<IPlaybackRule>(rulePtr));
    
    // initialize() should be called when rule is added
    EXPECT_TRUE(rulePtr->initializeCalled);
    
    // Test lifecycle notifications
    engine.notifyPlaybackStart();
    EXPECT_TRUE(rulePtr->startCalled);
    
    engine.notifyPlaybackEnd();
    EXPECT_TRUE(rulePtr->endCalled);
}

TEST_F(TestRulesEngine, MultipleRulesWithDifferentOutcomes) {
    RulesEngine engine;
    
    // Test that rules can return different outcomes and they're processed correctly
    engine.addRule(std::make_unique<MockPlaybackRule>(Priority::SAFETY, Outcome::CONTINUE, std::chrono::microseconds(50)));
    engine.addRule(std::make_unique<MockPlaybackRule>(Priority::CONTROL, Outcome::MODIFIED, std::chrono::microseconds(75)));
    engine.addRule(std::make_unique<MockPlaybackRule>(Priority::TIMING, Outcome::SEND_NOW, std::chrono::microseconds(25)));
    
    auto decision = engine.evaluate(0, testMessage, state);
    
    // Last rule should determine outcome (SEND_NOW), but delays should accumulate
    EXPECT_EQ(decision.outcome, Outcome::SEND_NOW);
    EXPECT_EQ(decision.accumulatedDelay.count(), 150); // 50 + 75 + 25
}

TEST_F(TestRulesEngine, RuleEvaluationWithDifferentStates) {
    RulesEngine engine;
    
    // Rule that behaves differently based on message index
    class ConditionalRule : public IPlaybackRule {
    public:
        Priority getPriority() const override { return Priority::CONTROL; }
        
        Decision apply(size_t messageIndex, const char*, const PlaybackState&, Decision current) override {
            Decision decision = current;
            if (messageIndex % 2 == 0) {
                decision.outcome = Outcome::CONTINUE;
            } else {
                decision.outcome = Outcome::DROP;
            }
            return decision;
        }
    };
    
    engine.addRule(std::make_unique<ConditionalRule>());
    
    // Test even message index
    state.setCurrentMessageIndex(0);
    auto decision1 = engine.evaluate(0, testMessage, state);
    EXPECT_EQ(decision1.outcome, Outcome::CONTINUE);
    
    // Test odd message index  
    state.setCurrentMessageIndex(1);
    auto decision2 = engine.evaluate(1, testMessage, state);
    EXPECT_EQ(decision2.outcome, Outcome::DROP);
}

TEST_F(TestRulesEngine, StatePassedCorrectly) {
    RulesEngine engine;
    
    // Rule that validates state is passed correctly
    class StateValidationRule : public IPlaybackRule {
    public:
        mutable PlaybackState receivedState;
        mutable size_t receivedMessageIndex = 0;
        
        Priority getPriority() const override { return Priority::CONTROL; }
        
        Decision apply(size_t messageIndex, const char*, const PlaybackState& state, Decision current) override {
            receivedState = state;
            receivedMessageIndex = messageIndex;
            return current;
        }
    };
    
    auto* rulePtr = new StateValidationRule();
    engine.addRule(std::unique_ptr<IPlaybackRule>(rulePtr));
    
    state.setCurrentMessageIndex(42);
    state.initialize(1000);
    state.start();
    
    engine.evaluate(42, testMessage, state);
    
    EXPECT_EQ(rulePtr->receivedMessageIndex, 42);
    EXPECT_EQ(rulePtr->receivedState.getCurrentMessageIndex(), 42);
    EXPECT_EQ(rulePtr->receivedState.getTotalMessages(), 1000);
    EXPECT_TRUE(rulePtr->receivedState.isRunning());
}

TEST_F(TestRulesEngine, LargeNumberOfRules) {
    RulesEngine engine;
    
    const size_t numRules = 100;
    
    // Add many rules with different priorities and delays
    for (size_t i = 0; i < numRules; i++) {
        Priority priority = static_cast<Priority>(i % 4); // Cycle through priorities
        auto delay = std::chrono::microseconds(i + 1);
        engine.addRule(std::make_unique<MockPlaybackRule>(priority, Outcome::CONTINUE, delay));
    }
    
    EXPECT_EQ(engine.getRuleCount(), numRules);
    
    // Should still work correctly with many rules
    auto decision = engine.evaluate(0, testMessage, state);
    EXPECT_EQ(decision.outcome, Outcome::CONTINUE);
    EXPECT_GT(decision.accumulatedDelay.count(), 0);
}

TEST_F(TestRulesEngine, NoAdvisorsByDefault) {
    RulesEngine engine;
    
    const auto& advisors = engine.getAdvisors();
    EXPECT_EQ(advisors.size(), 0);
}