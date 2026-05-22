"use client"

import { Card } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"

interface Review {
  id: string
  rating: number
  comment: string
  createdAt: Date
  reviewer: {
    name: string
    tier?: string
  }
}

interface ReviewsDisplayProps {
  reviews: Review[]
  averageRating: number
  totalReviews: number
}

export function ReviewsDisplay({ reviews, averageRating, totalReviews }: ReviewsDisplayProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
        <div>
          <div className="flex gap-1 mb-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star} className={star <= Math.round(averageRating) ? "text-yellow-400" : "text-gray-300"}>
                ★
              </span>
            ))}
          </div>
          <p className="text-sm text-gray-600">{totalReviews} reviews</p>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-gray-500">No reviews yet</p>
        ) : (
          reviews.map((review) => (
            <Card key={review.id} className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold">{review.reviewer.name}</p>
                  {review.reviewer.tier && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      Tier {review.reviewer.tier}
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={star <= review.rating ? "text-yellow-400" : "text-gray-300"}>
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-gray-700 mb-2">{review.comment}</p>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
              </p>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
