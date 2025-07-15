// DEX ROI Calculator - Main Application Logic

// KPI Metadata - Embedded as JS object
const KPI_DATA = [
    {
        id: 'ticket_volume',
        name: 'Service Desk Ticket Volume',
        type: 'percent_drop',
        tier: 'tangible',
        formula: 'ticket_volume',
        description: 'Reduction in overall service desk tickets',
        unit: 'tickets',
        extraInputs: ['ticketCount']
    },
    {
        id: 'mttr',
        name: 'Mean Time To Resolution (MTTR)',
        type: 'percent_drop',
        tier: 'tangible',
        formula: 'mttr',
        description: 'Average time to resolve incidents',
        unit: 'hours',
        extraInputs: ['ticketCount']
    },
    {
        id: 'cost_per_ticket',
        name: 'Cost Per Ticket',
        type: 'percent_drop',
        tier: 'tangible',
        formula: 'cost_per_ticket',
        description: 'Average cost to handle each ticket',
        unit: '$',
        extraInputs: ['ticketCount']
    },
    {
        id: 'shift_left',
        name: 'Shift-Left (L1 to L2 Escalation)',
        type: 'percent_drop',
        tier: 'tangible',
        formula: 'shift_left',
        description: 'Reduction in L2 escalations',
        unit: '%',
        extraInputs: ['l2HourlyRate', 'reducedL2Hours']
    },
    {
        id: 'device_utilization',
        name: 'Device Utilization',
        type: 'percent_increase',
        tier: 'tangible',
        formula: 'device_utilization',
        description: 'Improved device performance and usage',
        unit: '%',
        extraInputs: ['downtimeCost', 'overutilDelta']
    },
    {
        id: 'productivity_gain',
        name: 'Employee Productivity Gain',
        type: 'percent_increase',
        tier: 'tangible',
        formula: 'productivity_gain',
        description: 'Hours saved per employee per month',
        unit: 'hours',
        extraInputs: ['deltaHours']
    },
    {
        id: 'hardware_refresh',
        name: 'Hardware Refresh Avoidance',
        type: 'percent_increase',
        tier: 'tangible',
        formula: 'hardware_refresh',
        description: 'Delayed hardware replacement',
        unit: 'units',
        extraInputs: ['deferredUnits', 'unitHardwareCost']
    },
    {
        id: 'software_license',
        name: 'Software License Optimization',
        type: 'percent_increase',
        tier: 'tangible',
        formula: 'software_license',
        description: 'Reclaimed unused software licenses',
        unit: 'licenses',
        extraInputs: ['seatsReclaimed', 'unitLicenseCost']
    },
    {
        id: 'storage_utilization',
        name: 'Storage Utilization',
        type: 'percent_increase',
        tier: 'tangible',
        formula: 'storage_utilization',
        description: 'Optimized storage usage',
        unit: 'GB',
        extraInputs: ['deltaGB', 'storageCostGB']
    },
    {
        id: 'energy_efficiency',
        name: 'Energy Efficiency',
        type: 'percent_increase',
        tier: 'tangible',
        formula: 'energy_efficiency',
        description: 'Power consumption reduction per device',
        unit: '$',
        extraInputs: ['powerCostPerDevice']
    },
    {
        id: 'security_incidents',
        name: 'Security Incident Reduction',
        type: 'percent_drop',
        tier: 'intangible',
        formula: 'generic',
        description: 'Reduction in security-related incidents',
        unit: 'incidents'
    },
    {
        id: 'employee_satisfaction',
        name: 'Employee Satisfaction Score',
        type: 'percent_increase',
        tier: 'intangible',
        formula: 'generic',
        description: 'Overall employee satisfaction with IT',
        unit: 'score'
    },
    {
        id: 'compliance_score',
        name: 'Compliance Score',
        type: 'percent_increase',
        tier: 'intangible',
        formula: 'generic',
        description: 'IT compliance and governance score',
        unit: 'score'
    },
    {
        id: 'system_availability',
        name: 'System Availability',
        type: 'percent_increase',
        tier: 'intangible',
        formula: 'generic',
        description: 'Overall system uptime and availability',
        unit: '%'
    }
];

// Application State
let currentStep = 1;
let wizardData = {};
let calculationResults = {};

// DOM Elements
const homeSection = document.getElementById('home');
const wizardSection = document.getElementById('wizard');
const resultsSection = document.getElementById('results');
const wizardTitle = document.getElementById('wizard-title');
const progressBar = document.getElementById('progress-bar');

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    populateKPITable();
    updateRangeLabels();
});

// Event Listeners
function initializeEventListeners() {
    // Navigation
    document.getElementById('nav-home').addEventListener('click', function(e) {
        e.preventDefault();
        showHome();
    });
    
    document.getElementById('btn-start').addEventListener('click', function(e) {
        e.preventDefault();
        startWizard();
    });
    
    document.getElementById('btn-back').addEventListener('click', function(e) {
        e.preventDefault();
        goBack();
    });
    
    document.getElementById('btn-next').addEventListener('click', function(e) {
        e.preventDefault();
        goNext();
    });
    
    document.getElementById('btn-restart').addEventListener('click', function(e) {
        e.preventDefault();
        restartCalculator();
    });
    
    document.getElementById('btn-download').addEventListener('click', function(e) {
        e.preventDefault();
        downloadCSV();
    });

    // Range sliders
    document.getElementById('inp-horizon').addEventListener('input', updateRangeLabels);
    document.getElementById('inp-confidence').addEventListener('input', updateRangeLabels);
}

// Navigation Functions
function showHome() {
    homeSection.classList.remove('d-none');
    wizardSection.classList.add('d-none');
    resultsSection.classList.add('d-none');
}

function startWizard() {
    currentStep = 1;
    homeSection.classList.add('d-none');
    wizardSection.classList.remove('d-none');
    resultsSection.classList.add('d-none');
    updateWizardDisplay();
}

function goBack() {
    if (currentStep > 1) {
        currentStep--;
        updateWizardDisplay();
    }
}

function goNext() {
    if (validateCurrentStep()) {
        if (currentStep < 3) {
            currentStep++;
            updateWizardDisplay();
        } else {
            calculateResults();
        }
    }
}

function updateWizardDisplay() {
    // Update title and progress
    const titles = [
        'Step 1 / 3 – Deployment Basics',
        'Step 2 / 3 – KPI Selection & Baselines',
        'Step 3 / 3 – Scenario Parameters'
    ];
    
    wizardTitle.textContent = titles[currentStep - 1];
    progressBar.style.width = `${(currentStep / 3) * 100}%`;

    // Show/hide steps
    document.querySelectorAll('.wizard-step').forEach(step => {
        step.classList.add('d-none');
    });
    
    const currentStepElement = document.getElementById(`form-step-${String.fromCharCode(96 + currentStep)}`);
    if (currentStepElement) {
        currentStepElement.classList.remove('d-none');
    }

    // Update button states
    const backBtn = document.getElementById('btn-back');
    const nextBtn = document.getElementById('btn-next');
    
    backBtn.disabled = currentStep === 1;
    nextBtn.textContent = currentStep === 3 ? 'Calculate' : 'Next';
}

function validateCurrentStep() {
    if (currentStep === 1) {
        // Validate Step A - basic deployment info
        const requiredFields = ['inp-users', 'inp-platform-cost', 'inp-tech-rate', 'inp-avg-salary', 'inp-ticket-cost'];
        let isValid = true;
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            const value = parseFloat(field.value);
            
            if (isNaN(value) || value < 0) {
                field.classList.add('is-invalid');
                isValid = false;
            } else {
                field.classList.remove('is-invalid');
            }
        });
        
        if (!isValid) {
            alert('Please fill in all required fields with valid positive numbers.');
        }
        
        return isValid;
    } else if (currentStep === 2) {
        // Validate Step B - at least one KPI selected
        const selectedKPIs = document.querySelectorAll('#kpi-table input[type="checkbox"]:checked');
        
        if (selectedKPIs.length === 0) {
            alert('Please select at least one KPI to include in your calculation.');
            return false;
        }
        
        // Validate that selected KPIs have baseline and current values
        let isValid = true;
        selectedKPIs.forEach(checkbox => {
            const kpiId = checkbox.id.replace('include-', '');
            const baselineField = document.getElementById(`baseline-${kpiId}`);
            const currentField = document.getElementById(`current-${kpiId}`);
            
            if (!baselineField.value || !currentField.value) {
                baselineField.classList.add('is-invalid');
                currentField.classList.add('is-invalid');
                isValid = false;
            } else {
                baselineField.classList.remove('is-invalid');
                currentField.classList.remove('is-invalid');
            }
        });
        
        if (!isValid) {
            alert('Please enter baseline and current values for all selected KPIs.');
        }
        
        return isValid;
    }
    
    return true; // Step 3 has no validation requirements
}

function populateKPITable() {
    const tbody = document.querySelector('#kpi-table tbody');
    tbody.innerHTML = '';

    KPI_DATA.forEach(kpi => {
        const row = document.createElement('tr');
        
        // Include checkbox
        const includeCell = document.createElement('td');
        includeCell.innerHTML = `<input type="checkbox" class="form-check-input" id="include-${kpi.id}" />`;
        
        // KPI name with tooltip
        const nameCell = document.createElement('td');
        nameCell.innerHTML = `<span class="tooltip-trigger" title="${kpi.description}">${kpi.name}</span>`;
        
        // Baseline input
        const baselineCell = document.createElement('td');
        baselineCell.className = 'text-end';
        baselineCell.innerHTML = `<input type="number" class="form-control" id="baseline-${kpi.id}" placeholder="0" min="0" step="0.01" />`;
        
        // Current input
        const currentCell = document.createElement('td');
        currentCell.className = 'text-end';
        currentCell.innerHTML = `<input type="number" class="form-control" id="current-${kpi.id}" placeholder="0" min="0" step="0.01" />`;
        
        // Extra parameters
        const extraCell = document.createElement('td');
        if (kpi.extraInputs) {
            const extraInputs = kpi.extraInputs.map(input => {
                const defaultValue = getDefaultValue(input);
                const label = formatInputLabel(input);
                return `<div class="mb-1">
                    <small class="text-muted">${label}</small>
                    <input type="number" class="form-control form-control-sm" id="${input}-${kpi.id}" placeholder="${label}" min="0" step="0.01" value="${defaultValue}" />
                </div>`;
            }).join('');
            extraCell.innerHTML = extraInputs;
        }
        
        row.appendChild(includeCell);
        row.appendChild(nameCell);
        row.appendChild(baselineCell);
        row.appendChild(currentCell);
        row.appendChild(extraCell);
        
        tbody.appendChild(row);
    });
}

function formatInputLabel(inputType) {
    const labels = {
        'ticketCount': 'Annual Tickets',
        'l2HourlyRate': 'L2 Hourly Rate ($)',
        'reducedL2Hours': 'Reduced L2 Hours',
        'downtimeCost': 'Downtime Cost ($)',
        'overutilDelta': 'Utilization Delta (%)',
        'deltaHours': 'Hours Saved/Month',
        'deferredUnits': 'Deferred Units',
        'unitHardwareCost': 'Unit Cost ($)',
        'seatsReclaimed': 'Seats Reclaimed',
        'unitLicenseCost': 'License Cost ($)',
        'deltaGB': 'Storage Delta (GB)',
        'storageCostGB': 'Cost per GB ($)',
        'powerCostPerDevice': 'Power Cost/Device ($)'
    };
    return labels[inputType] || inputType;
}

function getDefaultValue(inputType) {
    const defaults = {
        'ticketCount': 10000,
        'l2HourlyRate': 65,
        'reducedL2Hours': 100,
        'downtimeCost': 500,
        'overutilDelta': 10,
        'deltaHours': 2,
        'deferredUnits': 100,
        'unitHardwareCost': 1200,
        'seatsReclaimed': 50,
        'unitLicenseCost': 120,
        'deltaGB': 1000,
        'storageCostGB': 0.10,
        'powerCostPerDevice': 50
    };
    return defaults[inputType] || 0;
}

function updateRangeLabels() {
    const horizon = document.getElementById('inp-horizon');
    const confidence = document.getElementById('inp-confidence');
    
    document.getElementById('lbl-horizon').textContent = `${horizon.value} quarters`;
    document.getElementById('lbl-confidence').textContent = `${confidence.value} %`;
}

function calculateResults() {
    // Collect basic deployment data
    const deployment = {
        users: parseInt(document.getElementById('inp-users').value),
        platformCost: parseFloat(document.getElementById('inp-platform-cost').value),
        techRate: parseFloat(document.getElementById('inp-tech-rate').value),
        avgSalary: parseFloat(document.getElementById('inp-avg-salary').value),
        ticketCost: parseFloat(document.getElementById('inp-ticket-cost').value),
        horizon: parseInt(document.getElementById('inp-horizon').value),
        confidence: parseFloat(document.getElementById('inp-confidence').value)
    };

    // Collect KPI data
    const selectedKPIs = [];
    KPI_DATA.forEach(kpi => {
        const includeCheckbox = document.getElementById(`include-${kpi.id}`);
        if (includeCheckbox.checked) {
            const baseline = parseFloat(document.getElementById(`baseline-${kpi.id}`).value) || 0;
            const current = parseFloat(document.getElementById(`current-${kpi.id}`).value) || 0;
            
            const kpiData = {
                ...kpi,
                baseline,
                current,
                extraParams: {}
            };
            
            // Collect extra parameters
            if (kpi.extraInputs) {
                kpi.extraInputs.forEach(input => {
                    const value = parseFloat(document.getElementById(`${input}-${kpi.id}`).value) || 0;
                    kpiData.extraParams[input] = value;
                });
            }
            
            selectedKPIs.push(kpiData);
        }
    });

    // Calculate results
    calculationResults = processCalculations(deployment, selectedKPIs);
    
    // Show results
    showResults();
}

function processCalculations(deployment, kpis) {
    let totalTangibleSavings = 0;
    let totalIntangibleScore = 0;
    let intangibleCount = 0;
    const kpiResults = [];

    kpis.forEach(kpi => {
        const improvement = calculateImprovement(kpi);
        const dollarSaved = calculateDollarSavings(kpi, deployment);
        const explanation = generateExplanation(kpi, improvement, dollarSaved);
        
        const result = {
            name: kpi.name,
            baseline: kpi.baseline,
            current: kpi.current,
            improvement: improvement,
            dollarSaved: dollarSaved,
            explanation: explanation,
            tier: kpi.tier
        };
        
        kpiResults.push(result);
        
        if (kpi.tier === 'tangible') {
            totalTangibleSavings += dollarSaved;
        } else {
            totalIntangibleScore += Math.abs(improvement);
            intangibleCount++;
        }
    });

    // Calculate intangible dollar equivalent
    const avgIntangibleImprovement = intangibleCount > 0 ? totalIntangibleScore / intangibleCount : 0;
    const intangibleDollarValue = (deployment.confidence / 100) * deployment.avgSalary * deployment.users * (avgIntangibleImprovement / 100) * 0.5;
    
    const totalSavings = totalTangibleSavings + intangibleDollarValue;
    const netROI = deployment.platformCost > 0 ? ((totalSavings - deployment.platformCost) / deployment.platformCost) * 100 : 0;

    return {
        totalTangibleSavings,
        totalIntangibleScore: avgIntangibleImprovement,
        intangibleDollarValue,
        totalSavings,
        netROI,
        kpiResults,
        deployment
    };
}

function calculateImprovement(kpi) {
    if (kpi.baseline === 0) return 0;
    
    if (kpi.type === 'percent_drop') {
        return ((kpi.baseline - kpi.current) / kpi.baseline) * 100;
    } else if (kpi.type === 'percent_increase') {
        return ((kpi.current - kpi.baseline) / kpi.baseline) * 100;
    }
    
    return 0;
}

function calculateDollarSavings(kpi, deployment) {
    const { baseline, current, extraParams } = kpi;
    
    switch (kpi.formula) {
        case 'ticket_volume':
            return ((baseline - current) / baseline) * extraParams.ticketCount * deployment.ticketCost;
        case 'mttr':
            return (baseline - current) * deployment.techRate * extraParams.ticketCount;
        case 'cost_per_ticket':
            return (baseline - current) * extraParams.ticketCount;
        case 'shift_left':
            return extraParams.reducedL2Hours * extraParams.l2HourlyRate;
        case 'device_utilization':
            return extraParams.overutilDelta * extraParams.downtimeCost;
        case 'productivity_gain':
            return extraParams.deltaHours * deployment.avgSalary / 2080 * deployment.users;
        case 'hardware_refresh':
            return extraParams.deferredUnits * extraParams.unitHardwareCost;
        case 'software_license':
            return extraParams.seatsReclaimed * extraParams.unitLicenseCost;
        case 'storage_utilization':
            return extraParams.deltaGB * extraParams.storageCostGB;
        case 'energy_efficiency':
            return (baseline - current) * extraParams.powerCostPerDevice;
        default:
            return 0; // Intangible KPIs don't have direct dollar savings
    }
}

function generateExplanation(kpi, improvement, dollarSaved) {
    const improvementStr = `${improvement.toFixed(1)}%`;
    const dollarStr = dollarSaved > 0 ? `$${dollarSaved.toLocaleString()}` : 'N/A';
    
    if (kpi.tier === 'tangible') {
        return `${improvementStr} improvement generating ${dollarStr} in savings`;
    } else {
        return `${improvementStr} improvement (intangible benefit)`;
    }
}

function showResults() {
    wizardSection.classList.add('d-none');
    resultsSection.classList.remove('d-none');
    
    // Update summary cards
    updateSummaryCards();
    
    // Create charts
    createBarChart();
    createRadarChart();
    
    // Update results table
    updateResultsTable();
}

function updateSummaryCards() {
    const summaryCards = document.getElementById('summary-cards');
    const { totalTangibleSavings, totalIntangibleScore, netROI } = calculationResults;
    
    summaryCards.innerHTML = `
        <div class="col-md-4">
            <div class="summary-card">
                <h4>Total Tangible Savings</h4>
                <p class="value positive">$${totalTangibleSavings.toLocaleString()}</p>
            </div>
        </div>
        <div class="col-md-4">
            <div class="summary-card">
                <h4>Intangible Improvement</h4>
                <p class="value">${totalIntangibleScore.toFixed(1)}%</p>
            </div>
        </div>
        <div class="col-md-4">
            <div class="summary-card">
                <h4>Net ROI</h4>
                <p class="value ${netROI >= 0 ? 'positive' : 'negative'}">${netROI.toFixed(1)}%</p>
            </div>
        </div>
    `;
}

function createBarChart() {
    const ctx = document.getElementById('bar-chart').getContext('2d');
    const { kpiResults } = calculationResults;
    
    // Sort by dollar saved and take top 10
    const sortedKPIs = kpiResults
        .filter(kpi => kpi.dollarSaved > 0)
        .sort((a, b) => b.dollarSaved - a.dollarSaved)
        .slice(0, 10);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedKPIs.map(kpi => kpi.name),
            datasets: [{
                label: 'Savings ($)',
                data: sortedKPIs.map(kpi => kpi.dollarSaved),
                backgroundColor: '#1FB8CD',
                borderColor: '#1FB8CD',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Top KPI Savings Contributions'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function createRadarChart() {
    const ctx = document.getElementById('radar-chart').getContext('2d');
    const { kpiResults } = calculationResults;
    
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: kpiResults.map(kpi => kpi.name),
            datasets: [{
                label: 'Improvement %',
                data: kpiResults.map(kpi => Math.abs(kpi.improvement)),
                backgroundColor: 'rgba(31, 184, 205, 0.2)',
                borderColor: '#1FB8CD',
                borderWidth: 2,
                pointBackgroundColor: '#1FB8CD'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'KPI Improvement Overview'
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
}

function updateResultsTable() {
    const tbody = document.querySelector('#results-table tbody');
    const { kpiResults } = calculationResults;
    
    tbody.innerHTML = kpiResults.map(kpi => `
        <tr>
            <td>${kpi.name}</td>
            <td class="text-end">${kpi.baseline.toLocaleString()}</td>
            <td class="text-end">${kpi.current.toLocaleString()}</td>
            <td class="text-end">${kpi.improvement.toFixed(1)}%</td>
            <td class="text-end">${kpi.dollarSaved > 0 ? '$' + kpi.dollarSaved.toLocaleString() : 'N/A'}</td>
            <td>${kpi.explanation}</td>
        </tr>
    `).join('');
}

function downloadCSV() {
    const { kpiResults } = calculationResults;
    
    const csvContent = [
        ['KPI', 'Baseline', 'Current', 'Improvement %', '$ Saved', 'Explanation'],
        ...kpiResults.map(kpi => [
            kpi.name,
            kpi.baseline,
            kpi.current,
            kpi.improvement.toFixed(1) + '%',
            kpi.dollarSaved > 0 ? '$' + kpi.dollarSaved.toLocaleString() : 'N/A',
            kpi.explanation
        ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'dex-roi-results.csv');
}

function restartCalculator() {
    currentStep = 1;
    wizardData = {};
    calculationResults = {};
    
    // Reset all form inputs
    document.querySelectorAll('input').forEach(input => {
        if (input.type === 'checkbox') {
            input.checked = false;
        } else if (input.type === 'range') {
            input.value = input.getAttribute('value');
        } else if (input.hasAttribute('value')) {
            input.value = input.getAttribute('value');
        } else {
            input.value = '';
        }
        input.classList.remove('is-invalid');
    });
    
    updateRangeLabels();
    showHome();
}