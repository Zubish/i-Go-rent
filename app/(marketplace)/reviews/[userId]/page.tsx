import { Suspense } from "react"
import { getReviewsForUser } from "@/app/actions/review-actions"
import { ReviewsDisplay } from "@/components/reviews-display"
import { Card } from "@/components/ui/card"

export default async function UserReviewsPage({ params }: { params: { userId: string } }) {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">User Reviews</h1>

        <Suspense fallback={<Card className="p-8 text-center">Loading reviews...</Card>}>
          <ReviewsSection userId={params.userId} />
        </Suspense>
      </div>
    </main>
  )
}

async function ReviewsSection({ userId }: { userId: string }) {
  const { reviews, averageRating, totalReviews } = await getReviewsForUser(userId)

  return <ReviewsDisplay reviews={reviews} averageRating={averageRating} totalReviews={totalReviews} />
}
