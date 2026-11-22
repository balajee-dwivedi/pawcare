import { Link } from 'react-router-dom';
import { PawMark } from './UI.jsx';

export default function HomePage() {
  return <main>
    <section className="hero"><div className="container hero-inner"><div>
      <div className="eyebrow">CARE STARTS CLOSE TO HOME</div>
      <h1>Someone nearby<br/>can <em>help.</em></h1>
      <p className="hero-copy">When an animal needs care, one clear report can bring neighbors, volunteers, and shelters together. Share what you see — we’ll help route the next step.</p>
      <div className="hero-actions"><Link className="button button-orange" to="/report">Report an animal <span aria-hidden="true">↗</span></Link><Link className="button button-outline" to="/assistance">Find assistance</Link></div>
      <p className="hero-note">A community bridge for rescue, reunion, and second chances.</p>
    </div><div className="hero-art" aria-label="PawCare connects reports to nearby rescuers">
      <div className="hero-orbit"/><span className="hero-stamp">GOOD CARE, PASSED ON</span><div className="hero-paw"><PawMark/></div>
      <div className="rescue-card"><small>NEARBY REQUEST · JUST NOW</small><strong>Someone needs a hand</strong><div className="mini-tags"><span>Animal care</span><span>Local helpers</span></div></div>
      <div className="quote-card"><strong>One report can start a rescue.</strong><span>Clear details help volunteers arrive prepared.</span></div>
    </div></div></section>
    <section className="trust-strip"><div className="container trust-row"><div className="trust-item"><span className="trust-icon">01</span><span><strong>Report</strong> A clear starting point</span></div><div className="trust-item"><span className="trust-icon">02</span><span><strong>Connect</strong> Local volunteer care</span></div><div className="trust-item"><span className="trust-icon">03</span><span><strong>Follow through</strong> Updates to resolution</span></div><div className="trust-item"><span className="trust-icon">04</span><span><strong>Find family</strong> Adoption & reunion</span></div></div></section>
    <section className="section"><div className="container"><div className="section-head"><div><div className="section-kicker">A SMALL STEP, A REAL DIFFERENCE</div><h2 className="section-title">Help should be easy to find.</h2><p className="section-subtitle">PawCare turns a moment of concern into a coordinated next step — for a stray, a lost pet, or an animal ready for a home.</p></div><Link className="button button-outline" to="/contact">How PawCare works</Link></div>
      <div className="steps-grid"><article className="step-card"><div className="step-number">01</div><h3>Share what you see</h3><p>Add an animal type, a short description, a location pin, and the kind of help needed. Every detail makes a response safer.</p></article><article className="step-card"><div className="step-number">02</div><h3>Someone nearby responds</h3><p>Verified requests are organized by urgency so volunteers can find the cases that need them first.</p></article><article className="step-card"><div className="step-number">03</div><h3>Care keeps moving</h3><p>Follow the rescue status, discover trusted shelters, and help animals find their way back or forward.</p></article></div>
    </div></section>
    <section className="section-tight"><div className="container"><div className="action-banner"><div><h2>Notice an animal who needs help?</h2><p>Share the location and what you know. A neighbor may be able to help.</p></div><Link to="/report" className="button button-orange">Make a report <span aria-hidden="true">↗</span></Link></div></div></section>
  </main>;
}
