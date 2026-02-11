import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold gradient-text">TeachBuddy.ai</span>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-secondary text-sm px-4 py-2">
            Sign In
          </Link>
          <Link href="/register" className="btn-primary text-sm px-4 py-2">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-background to-background" />

        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="text-center space-y-8 animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background-lighter border border-primary/30 text-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-text-secondary">AI-Powered Learning Platform</span>
            </div>

            {/* Main headline */}
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Transform Teaching Materials
              <br />
              Into <span className="gradient-text">Personalized Learning</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
              Upload your content. AI generates diagnostic tests, analyzes mistakes,
              and provides adaptive tutoring tailored to each student.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link href="/register" className="btn-primary text-lg px-8 py-4">
                Get Started Free
              </Link>
              <Link href="/login" className="btn-secondary text-lg px-8 py-4">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="card-hover">
            <div className="w-12 h-12 rounded-lg bg-gradient-card flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">AI Test Generation</h3>
            <p className="text-text-secondary">
              Upload your materials and instantly generate comprehensive diagnostic tests aligned with your content.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="card-hover">
            <div className="w-12 h-12 rounded-lg bg-gradient-card flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Mistake Analysis</h3>
            <p className="text-text-secondary">
              AI identifies weak areas and learning gaps by analyzing student answers in real-time.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="card-hover">
            <div className="w-12 h-12 rounded-lg bg-gradient-card flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-accent-violet" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Adaptive Tutoring</h3>
            <p className="text-text-secondary">
              Personalized explanations, examples, and practice exercises until mastery is achieved.
            </p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="section-divider" />

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Teacher-Aligned. Student-Focused.
          </h2>
          <p className="text-xl text-text-secondary">
            Not generic AI tutoring. Personalized learning based on your materials.
          </p>
        </div>
      </section>
    </main>
  );
}
