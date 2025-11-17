"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Star } from "lucide-react";

interface ReviewProps {
  name: string;
  userName: string;
  comment: string;
  rating: number;
}

const reviewList: ReviewProps[] = [
  {
    name: "Rajesh Kumar",
    userName: "Retail Store Owner",
    comment:
      "BizTool has transformed how we manage our inventory and sales. The mobile app is perfect for checking stock on the go. Highly recommended for small businesses!",
    rating: 5.0,
  },
  {
    name: "Priya Sharma",
    userName: "HR Manager",
    comment:
      "The attendance module with face recognition is a game-changer. No more manual attendance registers. Our payroll processing is now 10x faster.",
    rating: 5.0,
  },
  {
    name: "Amit Patel",
    userName: "Restaurant Owner",
    comment:
      "Managing multiple locations was a nightmare before BizTool. Now I can see everything in real-time from my phone. The analytics helped us increase revenue by 30%.",
    rating: 4.8,
  },
  {
    name: "Sneha Reddy",
    userName: "Manufacturing MSME",
    comment:
      "Best ERP solution for MSMEs. We tried expensive enterprise solutions but BizTool fits our needs perfectly at a fraction of the cost.",
    rating: 5.0,
  },
  {
    name: "Vikram Singh",
    userName: "Wholesale Distributor",
    comment:
      "The inventory tracking and order management features are excellent. Customer support is very responsive. Great value for money!",
    rating: 4.9,
  },
  {
    name: "Anjali Verma",
    userName: "Service Business Owner",
    comment:
      "Simple to use, powerful features. Our team adapted to it within a week. The mobile-first approach makes it accessible for everyone.",
    rating: 5.0,
  },
];

export const TestimonialSection = () => {
  return (
    <section id="testimonials" className="container py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h2 className="text-lg text-primary text-center mb-2 tracking-wider">
          Testimonials
        </h2>

        <h2 className="text-3xl md:text-4xl text-center font-bold mb-4">
          Trusted by 1000+ MSMEs Across India
        </h2>
      </div>

      <Carousel
        opts={{
          align: "start",
        }}
        className="relative w-[80%] sm:w-[90%] lg:max-w-screen-xl mx-auto"
      >
        <CarouselContent>
          {reviewList.map((review) => (
            <CarouselItem
              key={review.name}
              className="md:basis-1/2 lg:basis-1/3"
            >
              <Card className="bg-muted/50 dark:bg-card">
                <CardContent className="pt-6 pb-0">
                  <div className="flex gap-1 pb-6">
                    <Star className="size-4 fill-primary text-primary" />
                    <Star className="size-4 fill-primary text-primary" />
                    <Star className="size-4 fill-primary text-primary" />
                    <Star className="size-4 fill-primary text-primary" />
                    <Star className="size-4 fill-primary text-primary" />
                  </div>
                  {`"${review.comment}"`}
                </CardContent>

                <CardHeader>
                  <div className="flex flex-row items-center gap-4">
                    <Avatar>
                      <AvatarImage
                        src={`https://ui-avatars.com/api/?name=${review.name}&background=random`}
                        alt={review.name}
                      />
                      <AvatarFallback>{review.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col">
                      <CardTitle className="text-lg">{review.name}</CardTitle>
                      <CardDescription>{review.userName}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </section>
  );
};
