import React, { useState } from 'react';
import { jsPDF } from 'jspdf';

const ASSESSMENT_QUESTIONS = [
  {
    id: 1,
    section: 'source',
    sectionNum: 1,
    text: 'When a contract is renewed or amended, how does your team update the underlying amortization or accrual schedules?',
    options: [
      { text: 'Source-Linked: Our system is linked to source documents; amendments automatically trigger schedule updates and true-up entries.', points: 5 },
      { text: 'Manual Notification: We are manually notified of changes, then we manually update the Excel schedule and re-calculate the amortization.', points: 1 },
      { text: 'Surprise Discovery: We often discover changes during month-end flux analysis or via surprise invoices, requiring manual detective work.', points: 0 }
    ]
  },
  {
    id: 2,
    section: 'source',
    sectionNum: 1,
    text: 'How do you ensure that new projects or contracts signed by other departments are captured in your accruals before an invoice arrives?',
    options: [
      { text: 'Digital Link: Our contract signing process is digitally linked to our accrual tracking; a record is created for Accounting the moment a deal is signed.', points: 5 },
      { text: 'Manual Check-in: We rely on manual check-in processes or spreadsheet trackers shared by department heads to identify new commitments.', points: 1 },
      { text: 'Late Invoicing: We are often in the dark until an invoice hits the system, leading to catch-up accruals and missing costs.', points: 0 }
    ]
  },
  {
    id: 3,
    section: 'source',
    sectionNum: 1,
    text: 'How do you reconcile an incoming invoice against the original contract to ensure billing accuracy?',
    options: [
      { text: 'Auto-Match: Invoices are automatically matched to the digital contract record, ensuring technical calculations remain in sync.', points: 5 },
      { text: 'Manual Comparison: We manually compare the invoice against a spreadsheet or a PDF of the contract to verify numbers.', points: 1 },
      { text: 'Output-Focused: We focus primarily on the invoice amount; we lack a clear link between the contract and the GL to verify accuracy.', points: 0 }
    ]
  },
  {
    id: 4,
    section: 'erp',
    sectionNum: 2,
    text: 'When a subscription date shifts or a contract amount is updated mid-period, how does your system handle the adjustment?',
    options: [
      { text: 'Integrated Recalculation: The system automatically recalculates the new schedule and generates necessary true-up or catch-up entries.', points: 5 },
      { text: 'Manual Cleanup: We must manually back out old entries and post messy adjustments to correct the balance.', points: 1 },
      { text: 'Latent Discovery: We rarely catch these shifts until the following month or audit, leading to recurring inaccuracies.', points: 0 }
    ]
  },
  {
    id: 5,
    section: 'erp',
    sectionNum: 2,
    text: 'How are your month-end accruals and their subsequent reversals handled?',
    options: [
      { text: 'Fully Automated: Entries and reversals are integrated and scheduled through automated accounting logic to ensure synchronization.', points: 5 },
      { text: 'Hybrid Reversal: The ERP automates the reversal, but the calculation for the following month\'s entry is still manual.', points: 1 },
      { text: 'Fully Manual: We create the accrual and manually reverse it in Excel the following month, risking double-counting.', points: 0 }
    ]
  },
  {
    id: 6,
    section: 'audit',
    sectionNum: 3,
    text: 'If an auditor asks for the "Why" behind a specific balance, how easily can you produce the source evidence?',
    options: [
      { text: 'One-Click Trail: Transparent; every entry has a digital audit trail that links directly back to the source document.', points: 5 },
      { text: 'Messy Drawer: The calculations are clear, but they are disconnected from the original source contract or PDF.', points: 1 },
      { text: 'Black Box: It\'s a "Black Box" with logic buried in complex, multi-tab spreadsheets.', points: 0 }
    ]
  },
  {
    id: 7,
    section: 'audit',
    sectionNum: 3,
    text: 'On average, how long does it take to provide a full roll-forward report for a single PBC request?',
    options: [
      { text: 'Under 1 Hour: Reports are pre-configured and ready to export immediately.', points: 5 },
      { text: '2-5 Hours: Requires cleaning, formatting, and double-checking existing spreadsheets.', points: 1 },
      { text: '1+ Days: Requires manual reconstruction of data and fixing formula errors to tie to the GL.', points: 0 }
    ]
  }
];

export default function App() {
  const [appState, setAppState] = useState('intro'); 
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [emailInput, setEmailInput] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  
  // Tracking checkbox arrays using a state object hash layout
  const [selectedProducts, setSelectedProducts] = useState({
    'Lease Accounting': false,
    'SBITA Accounting': false,
    'Contract Management': false,
    'Accrual & Prepaid Accounting': false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalQuestions = ASSESSMENT_QUESTIONS.length;
  const currentProgressPercent = Math.round((currentQuestionIndex / totalQuestions) * 100);

  // CONFIGURATION CONSTANTS
  const PORTAL_ID = "3423792";
  const FORM_ID = "7f24ad5c-58e6-46fe-ab34-4f51bdf261bb";
  const WORDPRESS_URL_ENDPOINT = "https://finquerystg.wpenginepowered.com/wp-json/finquery/v1/upload-pdf";
  const CHILI_PIPER_LINK = "https://finquery.chilipiper.com/shared/marketing/rat-test";

  const PREMIUM_BUTTON_STYLE = {
    backgroundColor: '#0b3456',
    color: '#ffffff',
    borderRadius: '8px',
    border: 'none',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    outline: 'none'
  };

  const calculateScores = () => {
    let total = 0;
    let sourceScore = 0;
    let erpScore = 0;
    let auditScore = 0;

    ASSESSMENT_QUESTIONS.forEach((q) => {
      const points = answers[q.id] || 0;
      total += points;
      if (q.section === 'source') sourceScore += points;
      if (q.section === 'erp') erpScore += points;
      if (q.section === 'audit') auditScore += points;
    });

    return { total, sourceScore, erpScore, auditScore };
  };

  const getOverallStatus = (score) => {
    if (score <= 18) return { label: "Manual Saturation", desc: "Your process relies on heroic effort to overcome system limitations." };
    return { label: "Technical Debt", desc: "You have automated basics, but your risk has shifted to system logic and data scale." };
  };

  const getSourceGapFeedback = (score) => {
    if (score <= 2) return { short: "Manual Entry Saturation: You rely on human transcription for complex contracts, creating a Single Point of Failure risk.", long: "The Human Error Tax: Your current ingestion process requires high-level accounting talent to perform low-level data entry. This introduces systemic risk where a single missed amendment rolls forward indefinitely. FinQuery replaces this with automated ingestion." };
    if (score <= 10) return { short: "Workflow Friction: Your technical calculations live in disconnected workbooks, leading to Formula Drift over time.", long: "The Disconnected Logic Gap: You've automated the basic coding, but the heavy lifting is still in Excel. This creates a dangerous lag between your contracts and your GL. FinQuery centralizes this logic so your GL always reflects your current contract reality." };
    return { short: "Ingestion Logic Risk: Automation is high, but the risk has shifted to how systems interpret non-standard contract language.", long: "The Black-Box Logic Trap: You are sophisticated, but without a dedicated system of record, you lack a Source of Truth to audit that automation. FinQuery provides the verification layer needed to ensure automated extraction remains 100% compliant." };
  };

  const getErpGapFeedback = (score) => {
    if (score <= 2) return { short: "Structural Fragility: Your process is volume-capped. A spike in transactions would likely break your current workbooks.", long: "The Scalability Wall: Your team acts as the manual bridge for an ERP at its limit. Your close-time is tied directly to transaction volume. FinQuery automates the sub-ledger logic, allowing you to scale without increasing headcount." };
    if (score <= 6) return { short: "Resource Strain: You are strong-arming the close. You stay compliant through heroic manual effort and overtime.", long: "The Heroic Effort Penalty: You stay compliant through burnout. Your team spends the last week of every month in reconciliation hell. FinQuery eliminates the busy work of reversals, giving your team back 20-40% of their month." };
    return { short: "Systemic Drift Risk: High automation without human-in-the-loop verification can lead to long-term audit findings.", long: "The Logic Inertia Risk: When entries post automatically, it is easy for business logic to drift away from reality. FinQuery provides centralized visibility and logic-tagging, ensuring every automated entry is tied to an auditable rule." };
  };

  const getAuditGapFeedback = (score) => {
    if (score <= 2) return { short: "Transparency Failure: Your logic is a Black Box. You are currently Audit-Lucky, but vulnerable to deep-dive requests.", long: "The Audit Defensibility Gap: If an auditor asks to see the math, you have to manually reconstruct the trail from multiple tabs and PDFs. FinQuery creates a digital audit trail where every entry is one click from the original PDF." };
    if (score <= 6) return { short: "Evidence Latency: Fragmentation creates Auditor Friction. Slow responses lead to deeper sampling and higher costs.", long: "The Cost of Friction: It currently takes you hours or days to fulfill PBC requests. This delay signals to auditors that your controls are 'manual and weak.' FinQuery provides pre-configured roll-forwards that are audit-ready in minutes." };
    return { short: "Concentration Risk: Sophisticated automation requires higher scrutiny to ensure no logic errors are being applied at scale.", long: "The Automated Control Scrutiny: Auditors are shifting focus from sampling entries to auditing logic. FinQuery provides the centralized governance layer that proves to auditors your automated logic is locked and compliant." };
  };

  const formatSectionHeading = (sectionStr) => {
    if (!sectionStr) return '';
    if (sectionStr.toLowerCase() === 'erp') return 'ERP';
    return sectionStr.charAt(0).toUpperCase() + sectionStr.slice(1).toLowerCase();
  };

  const buildFullPDFDocument = () => {
    const scores = calculateScores();
    const status = getOverallStatus(scores.total);
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

    doc.setFillColor(11, 52, 86); 
    doc.rect(0, 0, 210, 45, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("EXECUTIVE TECHNICAL RISK ROADMAP", 15, 20);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Recipient: ${firstName} ${lastName}  |  Date: ${new Date().toLocaleDateString()}`, 15, 32);

    doc.setFillColor(245, 247, 250);
    doc.rect(15, 55, 180, 28, 'F');
    doc.setTextColor(11, 52, 86);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`Overall Status: ${status.label} (${scores.total} / 35 Points)`, 20, 64);
    doc.setTextColor(85, 85, 85);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(status.desc, 20, 74);

    // Section 1
    doc.setTextColor(11, 52, 86);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(`1. The ${formatSectionHeading(ASSESSMENT_QUESTIONS[0].section)} Gap Analysis — Score: ${scores.sourceScore}/15`, 15, 96);
    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const sLines = doc.splitTextToSize(getSourceGapFeedback(scores.sourceScore).long, 180);
    doc.text(sLines, 15, 104);

    // Section 2
    doc.setTextColor(11, 52, 86);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(`2. The ${formatSectionHeading(ASSESSMENT_QUESTIONS[3].section)} Gap Analysis — Score: ${scores.erpScore}/10`, 15, 142);
    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const eLines = doc.splitTextToSize(getErpGapFeedback(scores.erpScore).long, 180);
    doc.text(eLines, 15, 150);

    // Section 3
    doc.setTextColor(11, 52, 86);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(`3. The ${formatSectionHeading(ASSESSMENT_QUESTIONS[5].section)} Gap Analysis — Score: ${scores.auditScore}/10`, 15, 188);
    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const aLines = doc.splitTextToSize(getAuditGapFeedback(scores.auditScore).long, 180);
    doc.text(aLines, 15, 196);

    doc.setDrawColor(200, 200, 200);
    doc.line(15, 260, 195, 260);
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text("Confidential Advisory Document — Powered by FinQuery", 15, 268);

    return doc;
  };

  const handleCheckboxChange = (optionName) => {
    setSelectedProducts(prev => ({
      ...prev,
      [optionName]: !prev[optionName]
    }));
  };

  const handleDualHandshakeSubmit = async (e) => {
    e.preventDefault();
    if (!emailInput || isSubmitting) return;

    setIsSubmitting(true);
    let liveReportUrl = "https://finquery.com/generation-error-fallback";
    const cleanFileName = `${firstName}_${lastName}_Technical_Risk_Report.pdf`;

    try {
      const docObj = buildFullPDFDocument();
      const pdfBlob = docObj.output('blob');
      
      const wpFormData = new FormData();
      wpFormData.append("assessment_pdf", pdfBlob, cleanFileName);

      console.log("Posting file binary packages to WordPress endpoint...");
      const wpResponse = await fetch(WORDPRESS_URL_ENDPOINT, {
        method: "POST",
        body: wpFormData
      });

      if (wpResponse.ok) {
        const wpData = await wpResponse.json();
        liveReportUrl = wpData.url; 
        console.log("Successfully hosted file URL string:", liveReportUrl);
      } else {
        console.warn("WordPress server rejected file array stream processing.");
      }
    } catch (err) {
      console.error("Failed to connect to WordPress hosting endpoints:", err);
    }

    // Process checkbox values into HubSpot internal value mapping schemas
    try {
      const hubspotActiveValues = [];
      if (selectedProducts['Lease Accounting']) hubspotActiveValues.push('Lease Accounting');
      if (selectedProducts['SBITA Accounting']) hubspotActiveValues.push('SBITA Accounting');
      if (selectedProducts['Contract Management']) hubspotActiveValues.push('Financial Contract Management');
      if (selectedProducts['Accrual & Prepaid Accounting']) hubspotActiveValues.push('Prepaid & Accrual Accounting');

      // Convert arrays into semi-colon separated string blocks matching HubSpot formatting guidelines
      const productOfInterestString = hubspotActiveValues.join(';');

      const hubspotPayload = {
        fields: [
          { name: "email", value: emailInput },
          { name: "firstname", value: firstName },
          { name: "lastname", value: lastName },
          { name: "phone", value: phoneInput || "" },
          { name: "inbound___product_of_interest", value: productOfInterestString },
          { name: "cro1", value: liveReportUrl } 
        ],
        context: {
          pageUri: window.location.href,
          pageName: document.title
        }
      };

      const hsEndpoint = `https://api.hsforms.com/submissions/v3/integration/submit/${PORTAL_ID}/${FORM_ID}`;
      
      const hsResponse = await fetch(hsEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hubspotPayload)
      });

      if (hsResponse.ok) {
        console.log("HubSpot successfully updated contact records.");
      } else {
        console.error("HubSpot Submission Refusal Status Code:", hsResponse.status, await hsResponse.text());
      }
    } catch (hsErr) {
      console.error("HubSpot network processing failure:", hsErr);
    }

    setIsSubmitting(false);
    setAppState('results');
  };

  const handleOptionSelect = (points) => {
    const currentQuestion = ASSESSMENT_QUESTIONS[currentQuestionIndex];
    setAnswers({ ...answers, [currentQuestion.id]: points });

    if (currentQuestionIndex + 1 < totalQuestions) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setAppState('lead-capture');
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleRedirectToChiliPiper = () => {
    window.open(CHILI_PIPER_LINK, '_blank', 'noopener,noreferrer');
  };

  // --- RENDERING VIEWS ---
  if (appState === 'intro') {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
        <header>
          <h1 style={{ lineHeight: '1.25', marginBottom: '15px', fontSize: '32px' }}>
            The FinQuery Month-End Close Risk Assessment
          </h1>
          <h3 style={{ lineHeight: '1.4', color: '#333' }}>
            Does your month-end feel like a marathon of manual accrued and prepaid expenses?
          </h3>
          <p style={{ lineHeight: '1.5', color: '#555' }}>
            Most ERPs leave the heavy lifting of technical accounting to you and your spreadsheets. Take this 2-minute diagnostic assessment to uncover your Complexity Gap and see if you're actually audit-ready—or just one broken formula away from an audit finding.
          </p>
        </header>
        <section style={{ margin: '25px 0', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
          <ul style={{ lineHeight: '1.8' }}>
            <li><strong>Uncover</strong> hidden operational risks in your ERP.</li>
            <li><strong>Benchmark</strong> your close process against industry standards.</li>
            <li><strong>Receive</strong> a customized Technical Risk Roadmap.</li>
          </ul>
        </section>
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button onClick={() => setAppState('quiz')} style={{ ...PREMIUM_BUTTON_STYLE, padding: '16px 36px', fontSize: '18px' }}>
            Analyze My Close Risk
          </button>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>No credit card required. Takes less than 2 minutes.</p>
        </div>
      </div>
    );
  }

  if (appState === 'quiz') {
    const currentQuestion = ASSESSMENT_QUESTIONS[currentQuestionIndex];
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ width: '100%', backgroundColor: '#e0e0e0', borderRadius: '4px', height: '10px', marginBottom: '10px' }}>
          <div style={{ width: `${currentProgressPercent}%`, backgroundColor: '#0b3456', height: '100%', borderRadius: '4px', transition: 'width 0.3s ease-in-out' }} />
        </div>
        
        <div style={{ fontSize: '12px', color: '#666', textAlign: 'right', marginBottom: '20px' }}>
          Progress: {currentProgressPercent}% (Question {currentQuestionIndex + 1} of {totalQuestions})
        </div>

        <div style={{ minHeight: '250px', marginBottom: '25px' }}>
          <span style={{ fontSize: '16px', color: '#888', fontWeight: 'bold', letterSpacing: '1px' }}>
            Section {currentQuestion.sectionNum}: {formatSectionHeading(currentQuestion.section)} Gap
          </span>
          <h2 style={{ marginTop: '10px', marginBottom: '25px', lineHeight: '1.3' }}>{currentQuestion.text}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {currentQuestion.options.map((option, idx) => (
              <button key={idx} onClick={() => handleOptionSelect(option.points)} style={{ padding: '15px', textAlign: 'left', fontSize: '15px', cursor: 'pointer', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px', lineHeight: '1.4' }}>
                {option.text}
              </button>
            ))}
          </div>
        </div>

        <div style={{ minHeight: '24px', display: 'flex', justifyContent: 'flex-start', marginTop: '15px' }}>
          {currentQuestionIndex > 0 && (
            <button 
              onClick={handlePreviousQuestion}
              style={{
                background: 'none',
                border: 'none',
                color: '#0b3456',
                fontSize: '14px', 
                fontWeight: 'bold',
                cursor: 'pointer',
                padding: '0',
                textDecoration: 'underline'
              }}
            >
              &larr; Previous Question
            </button>
          )}
        </div>
      </div>
    );
  }

  if (appState === 'lead-capture') {
    return (
      <div style={{ padding: '40px 20px', fontFamily: 'sans-serif', maxWidth: '550px', margin: '0 auto', textAlign: 'center' }}>
        <span style={{ fontSize: '18px', textTransform: 'capitalize', color: '#0b3456', fontWeight: 'bold', letterSpacing: '1px' }}>
          Diagnostic Complete
        </span>
        <h2 style={{ marginTop: '10px', marginBottom: '20px', fontSize: '26px', lineHeight: '1.3' }}>Your Risk Profile is Ready.</h2>
        <p style={{ color: '#444', fontSize: '15px', lineHeight: '1.6', marginBottom: '30px', textAlign: 'left' }}>
          Your results suggest your team is managing a level of technical accounting complexity that standard ERPs and spreadsheets weren’t built to handle. We’ve identified specific gaps where your current process may be masking significant audit risk.
        </p>
        
        <form onSubmit={handleDualHandshakeSubmit} style={{ backgroundColor: '#f9f9f9', padding: '25px', borderRadius: '8px', border: '1px solid #e0e0e0', textAlign: 'left' }}>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '14px', color: '#333' }}>
                First Name <span style={{ color: '#cc0000' }}>*</span>
              </label>
              <input 
                type="text" 
                required
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '14px', color: '#333' }}>
                Last Name <span style={{ color: '#cc0000' }}>*</span>
              </label>
              <input 
                type="text" 
                required
                placeholder="Smith"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '14px', color: '#333' }}>
              Business Email Address <span style={{ color: '#cc0000' }}>*</span>
            </label>
            <input 
              type="email" 
              required 
              placeholder="name@company.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          {/* ADDED: Phone Number Input View Control Wrapper */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '14px', color: '#333' }}>
              Phone Number <span style={{ color: '#cc0000' }}>*</span>
            </label>
            <input 
              type="tel" 
              required 
              placeholder="(555) 555-5555"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          {/* ADDED: Multi-Select Product of Interest Option Checkbox Container Group */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px', fontSize: '14px', color: '#333' }}>
              Product of Interest <span style={{ color: '#cc0000' }}>*</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.keys(selectedProducts).map((product) => (
                <label key={product} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox"
                    checked={selectedProducts[product]}
                    onChange={() => handleCheckboxChange(product)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  {product}
                </label>
              ))}
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} style={{ ...PREMIUM_BUTTON_STYLE, width: '100%', padding: '14px', opacity: isSubmitting ? 0.7 : 1 }}>
            {isSubmitting ? "Processing Roadmap..." : "Submit and View My Analysis"}
          </button>
        </form>
      </div>
    );
  }

  if (appState === 'results') {
    const scores = calculateScores();
    const overallStatus = getOverallStatus(scores.total);
    
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '650px', margin: '0 auto' }}>
        <div style={{ width: '100%', backgroundColor: '#0b3456', borderRadius: '4px', height: '10px', marginBottom: '20px' }} />
        
        <header style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ lineHeight: '1.25', marginBottom: '10px', fontSize: '32px' }}>Your Close Risk Analysis</h1>
          <p style={{ textTransform: 'capitalize', color: '#666', letterSpacing: '1px', margin: '0' }}>Diagnostic Complete</p>
        </header>

        <section style={{ border: '2px solid #0b3456', padding: '20px', borderRadius: '8px', backgroundColor: '#fcfdfe', marginBottom: '25px' }}>
          <h3 style={{ margin: '0 0 5px 0', color: '#666' }}>Overall Status</h3>
          <h2 style={{ margin: '0 0 10px 0', color: '#0b3456', fontSize: '28px', lineHeight: '1.2' }}>
            {overallStatus.label} ({scores.total} / 35 Points)
          </h2>
          <p style={{ margin: '0', fontSize: '16px', lineHeight: '1.4' }}>{overallStatus.desc}</p>
        </section>

        <div style={{ textAlign: 'center', padding: '10px 0 35px 0', borderBottom: '1px solid #eee', marginBottom: '30px' }}>
          <button onClick={handleRedirectToChiliPiper} style={{ ...PREMIUM_BUTTON_STYLE, padding: '16px 36px', boxShadow: '0 4px 12px rgba(11,52,86,0.15)' }}>
            Schedule My Report Review
          </button>
        </div>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ borderBottom: '2px solid #ccc', paddingBottom: '8px', marginBottom: '25px', lineHeight: '1.3' }}>Your Critical Gaps</h2>
          <p style={{ color: '#444', lineHeight: '1.5' }}>We\'ve analyzed your responses across the three pillars of technical accounting. Based on your inputs, here are your primary exposure points:</p>

          <div style={{ margin: '25px 0', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 5px 0', color: '#555', letterSpacing: '0.5px', fontSize: '18px' }}>
              1. The {formatSectionHeading('source')} Gap (Score: {scores.sourceScore}/15)
            </h4>
            <p style={{ margin: '0', color: '#111', lineHeight: '1.5', fontSize: '15px' }}>{getSourceGapFeedback(scores.sourceScore).short}</p>
          </div>

          <div style={{ margin: '25px 0', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 5px 0', color: '#555', letterSpacing: '0.5px', fontSize: '18px' }}>
              2. The {formatSectionHeading('erp')} Gap (Score: {scores.erpScore}/10)
            </h4>
            <p style={{ margin: '0', color: '#111', lineHeight: '1.5', fontSize: '15px' }}>{getErpGapFeedback(scores.erpScore).short}</p>
          </div>

          <div style={{ margin: '25px 0', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 5px 0', color: '#555', letterSpacing: '0.5px', fontSize: '18px' }}>
              3. The {formatSectionHeading('audit')} Gap (Score: {scores.auditScore}/10)
            </h4>
            <p style={{ margin: '0', color: '#111', lineHeight: '1.5', fontSize: '15px' }}>{getAuditGapFeedback(scores.auditScore).short}</p>
          </div>
        </section>

        <footer style={{ textAlign: 'center', marginTop: '5px', padding: '30px 10px', borderTop: '1px solid #eee' }}>
          <p style={{ fontSize: '16px', marginBottom: '20px', lineHeight: '1.5' }}>
            Schedule time to discuss these findings with a FinQuery expert.
          </p>
          <button onClick={handleRedirectToChiliPiper} style={{ ...PREMIUM_BUTTON_STYLE, padding: '16px 36px' }}>
            Schedule My Report Review
          </button>
        </footer>
      </div>
    );
  }
}