/**
 * Pipeline Controller - Orchestrate complete trading workflow
 * Single responsibility: Manage multi-step trading pipeline
 */

import { UI_CONSTANTS } from '../config/constants.js';
import { DOMUtils } from '../utils/dom.js';
import { ErrorHandler } from '../utils/errors.js';
import { notifications } from '../components/NotificationSystem.js';
import { MarketDataGenerator } from '../generator/Generator.js';

export class PipelineController {
    constructor(containerId = 'pipeline-container') {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container element '${containerId}' not found`);
        }
        
        this.steps = new Map();
        this.currentStep = 'generator';
        this.stepData = new Map();
        
        this.init();
    }
    
    /**
     * Initialize pipeline
     */
    init() {
        this.render();
        this.initializeCurrentStep();
    }
    
    /**
     * Render pipeline interface
     */
    render() {
        this.container.innerHTML = '';
        
        this.renderHeader();
        this.renderProgressIndicator();
        this.renderStepsContainer();
    }
    
    /**
     * Render pipeline header
     */
    renderHeader() {
        const header = DOMUtils.createElement('div', {
            className: 'page-header'
        });
        
        const title = DOMUtils.createElement('h1', {
            className: 'page-title'
        }, 'Beacon.');
        
        const subtitle = DOMUtils.createElement('p', {
            className: 'page-subtitle'
        }, 'Complete Trading Pipeline');
        
        header.appendChild(title);
        header.appendChild(subtitle);
        this.container.appendChild(header);
    }
    
    /**
     * Render progress indicator
     */
    renderProgressIndicator() {
        const progress = DOMUtils.createElement('div', {
            className: 'pipeline-progress',
            style: {
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 'var(--space-xl)',
                padding: 'var(--space-md)',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-primary)'
            }
        });
        
        const steps = [
            { id: 'generator', title: 'Generate', description: 'Market Data' },
            { id: 'playback', title: 'Stream', description: 'Data Feed' },
            { id: 'algorithm', title: 'Execute', description: 'Strategy' },
            { id: 'monitoring', title: 'Monitor', description: 'Results' }
        ];
        
        steps.forEach((step, index) => {
            const stepEl = this.createProgressStep(step, index === 0);
            progress.appendChild(stepEl);
        });
        
        this.container.appendChild(progress);
    }
    
    /**
     * Create progress step indicator
     */
    createProgressStep(step, isActive) {
        const stepEl = DOMUtils.createElement('div', {
            className: 'progress-step',
            dataset: { step: step.id },
            style: {
                textAlign: 'center',
                padding: 'var(--space-md)',
                borderRadius: 'var(--radius-md)',
                transition: 'all var(--timing-fast)',
                cursor: 'pointer',
                opacity: isActive ? '1' : '0.6'
            }
        });
        
        const number = DOMUtils.createElement('div', {
            style: {
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: isActive ? 'var(--color-primary)' : 'var(--bg-input)',
                color: isActive ? 'white' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--space-xs)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-semibold)'
            }
        }, String(step.id === 'generator' ? '1' : step.id === 'playback' ? '2' : step.id === 'algorithm' ? '3' : '4'));
        
        const title = DOMUtils.createElement('div', {
            style: {
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--space-xs)'
            }
        }, step.title);
        
        const description = DOMUtils.createElement('div', {
            style: {
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-muted)'
            }
        }, step.description);
        
        stepEl.appendChild(number);
        stepEl.appendChild(title);
        stepEl.appendChild(description);
        
        return stepEl;
    }
    
    /**
     * Render steps container
     */
    renderStepsContainer() {
        const stepsContainer = DOMUtils.createElement('div', {
            className: 'pipeline-steps'
        });
        
        // Generator step
        const generatorStep = DOMUtils.createElement('div', {
            className: 'pipeline-step active',
            id: 'step-generator',
            style: {
                display: 'block'
            }
        });
        
        // Other steps (hidden initially)
        const playbackStep = DOMUtils.createElement('div', {
            className: 'pipeline-step',
            id: 'step-playback',
            style: {
                display: 'none'
            }
        }, 'Playback configuration will appear here...');
        
        const algorithmStep = DOMUtils.createElement('div', {
            className: 'pipeline-step',
            id: 'step-algorithm',
            style: {
                display: 'none'
            }
        }, 'Algorithm configuration will appear here...');
        
        const monitoringStep = DOMUtils.createElement('div', {
            className: 'pipeline-step',
            id: 'step-monitoring',
            style: {
                display: 'none'
            }
        }, 'Monitoring dashboard will appear here...');
        
        stepsContainer.appendChild(generatorStep);
        stepsContainer.appendChild(playbackStep);
        stepsContainer.appendChild(algorithmStep);
        stepsContainer.appendChild(monitoringStep);
        
        this.container.appendChild(stepsContainer);
    }
    
    /**
     * Initialize current step component
     */
    initializeCurrentStep() {
        switch (this.currentStep) {
            case 'generator':
                this.initializeGenerator();
                break;
            case 'playback':
                this.initializePlayback();
                break;
            case 'algorithm':
                this.initializeAlgorithm();
                break;
            case 'monitoring':
                this.initializeMonitoring();
                break;
        }
    }
    
    /**
     * Initialize generator step
     */
    initializeGenerator() {
        const generatorContainer = document.getElementById('step-generator');
        
        // Create generator component configured for pipeline mode
        const generator = new MarketDataGenerator('step-generator');
        
        // Override generator methods to integrate with pipeline
        const originalSave = generator.saveConfiguration.bind(generator);
        const originalRun = generator.runGenerator.bind(generator);
        
        generator.saveConfiguration = async () => {
            try {
                await originalSave();
                // Save configuration data for next step
                this.stepData.set('generator', generator.state.exportConfig());
                notifications.success('Generator configuration saved! Ready for next step.');
                this.enableNextStep();
            } catch (error) {
                notifications.error('Failed to save generator configuration');
            }
        };
        
        generator.runGenerator = async () => {
            try {
                await originalRun();
                // Mark step complete and advance
                this.completeStep('generator', generator.state.exportConfig());
                this.advanceToStep('playback');
            } catch (error) {
                notifications.error('Failed to generate market data');
            }
        };
        
        this.steps.set('generator', generator);
    }
    
    /**
     * Initialize other steps (placeholder)
     */
    initializePlayback() {
        notifications.info('Playback step - Coming soon!');
    }
    
    initializeAlgorithm() {
        notifications.info('Algorithm step - Coming soon!');
    }
    
    initializeMonitoring() {
        notifications.info('Monitoring step - Coming soon!');
    }
    
    /**
     * Complete current step and store data
     */
    completeStep(stepId, data) {
        this.stepData.set(stepId, data);
        
        // Mark step as completed in UI
        const stepEl = document.querySelector(`[data-step="${stepId}"]`);
        if (stepEl) {
            stepEl.classList.add('completed');
            const number = stepEl.querySelector('div');
            number.textContent = '✓';
            number.style.background = 'var(--color-success)';
        }
        
        // Hide completed step content (roll-up effect)
        const stepContainer = document.getElementById(`step-${stepId}`);
        if (stepContainer) {
            DOMUtils.animate(stepContainer, {
                maxHeight: '60px',
                opacity: '0.7'
            });
            stepContainer.style.pointerEvents = 'none';
        }
    }
    
    /**
     * Advance to next step
     */
    advanceToStep(stepId) {
        // Hide current step
        const currentStepContainer = document.getElementById(`step-${this.currentStep}`);
        if (currentStepContainer) {
            currentStepContainer.style.display = 'none';
        }
        
        // Show next step
        const nextStepContainer = document.getElementById(`step-${stepId}`);
        if (nextStepContainer) {
            nextStepContainer.style.display = 'block';
        }
        
        // Update progress indicator
        this.updateProgressIndicator(stepId);
        
        // Update current step
        this.currentStep = stepId;
        
        // Initialize the new step
        this.initializeCurrentStep();
        
        notifications.info(`Advanced to ${stepId} step`);
    }
    
    /**
     * Update progress indicator
     */
    updateProgressIndicator(activeStepId) {
        document.querySelectorAll('.progress-step').forEach(step => {
            const isActive = step.dataset.step === activeStepId;
            step.style.opacity = isActive ? '1' : '0.6';
            
            const number = step.querySelector('div');
            if (isActive && !step.classList.contains('completed')) {
                number.style.background = 'var(--color-primary)';
                number.style.color = 'white';
            }
        });
    }
    
    /**
     * Enable next step button (if generator has save/run separation)
     */
    enableNextStep() {
        // This could be used if we want to separate save and advance
        console.log('Next step enabled');
    }
    
    /**
     * Get all pipeline data
     */
    getPipelineData() {
        return Object.fromEntries(this.stepData);
    }
}