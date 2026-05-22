"use client"

import Link from "next/link"

const categories = [
  { name: "Accommodation", emoji: "🏠", color: "from-blue-400 to-blue-600" },
  { name: "Vehicles", emoji: "🚗", color: "from-green-400 to-green-600" },
  { name: "Photo Gear", emoji: "📷", color: "from-yellow-400 to-yellow-600" },
  { name: "Machines", emoji: "⚙️", color: "from-orange-400 to-orange-600" },
  { name: "Grills", emoji: "🔥", color: "from-red-400 to-red-600" },
  { name: "Boats", emoji: "⛵", color: "from-cyan-400 to-cyan-600" },
  { name: "Events", emoji: "🎉", color: "from-purple-400 to-purple-600" },
  { name: "More", emoji: "⭐", color: "from-pink-400 to-pink-600" },
]

export function CategoriesGrid() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h2 className="text-4xl font-bold text-center mb-12">Popular Categories</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {categories.map((category) => (
          <Link
            key={category.name}
            href={`/browse?category=${category.name.toLowerCase()}`}
            className={`bg-gradient-to-br ${category.color} rounded-xl p-6 text-white shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer`}
          >
            <div className="text-5xl mb-3">{category.emoji}</div>
            <h3 className="text-xl font-semibold">{category.name}</h3>
          </Link>
        ))}
      </div>
    </section>
  )
}
