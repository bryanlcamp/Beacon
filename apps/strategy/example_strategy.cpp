#pragma once

   #include <beacon_strategy>
   #include <beacon_order>

   // Namespace abbreviations for readability.
   namespace bs = beacon_strategy;
   namespace bo = beacon_order;

   // Note: overrides are for template/concepts.
   //
   // Each of the methods below assume you will check 
   // basic preconditions around order ids, fill ids, status.

   class ExampleStrategy : public bs::StrategyBase {
      public:

         explicit ExampleStrategy(const nlohmann::json& config) : 
            bs::StrategyBase(config) {
            // Opportunity to read your own .json.
         }

         void onMarketDataReceived(const bo::MarketMessage& msg) override {
            // Strategy implementation.
         }

         void onOrderSubmitConfirm(const bo::Order& order) override {
            // Confirm submit is for what was requested. Store order Id.
            _activeOrder.Status = OrderStatus.Working;
         }

        void onOrderUpdateConfirm(const bo::Order& order) override {
            // Confirm update is for what was requested. Check qty, status.
            _activeOrder.Status = OrderStatus.Working;
        }

        void onOrderFilled(const bo::OrderFill& fill) override {
           if (!_activeOrder.ApplyFill(fill)) {
              // Fill isn't for this order/overfilled. Throw?        
           }
        }

        void onOrderRejected(const bo::OrderRequest& req) override {
           // Strategy implementation..
           // _orderManager.cancel(req.Order.Id);
        }

        void onExchangeMessageReceived(const bo::ExchangeMessage& msg) override {
           // This could be a disaster - Strategy implementation...
           // _orderManager.submit(...);
        }

    private:
       // All messaging between the strategy and matching engine.
       std::unique_ptr<bo::OrderManager> _orderManager;

       // Reused for cache locality purposes.
       bo::Order _activeOrder;
   };

   // For static template polymorphism.
   REGISTER_ALGORITHM(ExampleStrategy);