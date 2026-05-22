"use client"

const steps = [
  {
    number: "1",
    title: "Browse",
    description: "Explore thousands of verified listings in your area. Filter by category, price, and ratings.",
    icon: "🔍",
  },
  {
    number: "2",
    title: "Book",
    description: "Make a booking with secure escrow payment. Money is held safely until confirmation.",
    icon: "✓",
  },
  {
    number: "3",
    title: "Enjoy",
    description: "Pick up your rental and enjoy! Leave a review and earn trust points.",
    icon: "😊",
  },
]

export function HowItWorks() {
  return (
    <section className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, idx) => (
            <div key={step.number} className="relative">
              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute top-20 left-[60%] w-[40%] h-0.5 bg-gradient-to-r from-blue-600 to-cyan-600"></div>
              )}

              <div className="bg-white rounded-xl p-8 text-center shadow-lg relative">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 text-white text-4xl mb-4 relative z-10">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
