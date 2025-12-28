import { Box } from "@/components/box";
import { NumberFormatted } from "@/components/number-formatted";
import { ProductDescriptionRow } from "@/components/product-description-row";
import { RankingDrawer } from "@/components/ranking-drawer";
import { RankingPositionMarker } from "@/components/ranking-position-marker";
import { SectionHeader } from "@/components/section-header";
import {
  queries,
  type QueryRankingWithReviews,
  type RankingWithReviewsQuery,
} from "@/data/queries";
import type { Category } from "@/data/static";
import { t } from "@/lib/i18n";
import Image from "next/image";
import type { FiltersRankings } from "../page";

const defaultFilters: FiltersRankings = {
  categories: null,
  cities: null,
  critics: null,
  "rating-min": null,
  "rating-max": null,
  "reviews-min": null,
  q: null,
};

export default async function PageChampions() {
  const rankingsBurgersPromise = queries.rankingsWithReviews({
    ...defaultFilters,
    categories: ["burger"],
  });
  const rankingsDoenersPromise = queries.rankingsWithReviews({
    ...defaultFilters,
    categories: ["doener"],
  });
  const rankingsPizzasPromise = queries.rankingsWithReviews({
    ...defaultFilters,
    categories: ["pizza"],
  });

  return (
    <div>
      <SectionHeader>Die Champions</SectionHeader>

      <h2 className="mb-8 mt-4 text-center text-2xl">
        Deutschlands beste Gerichte je Kategorie
      </h2>

      <TopByCategories
        rankingsBurgersPromise={rankingsBurgersPromise}
        rankingsDoenersPromise={rankingsDoenersPromise}
        rankingsPizzasPromise={rankingsPizzasPromise}
      />
    </div>
  );
}

async function TopByCategories({
  rankingsBurgersPromise,
  rankingsDoenersPromise,
  rankingsPizzasPromise,
}: {
  rankingsBurgersPromise: QueryRankingWithReviews;
  rankingsDoenersPromise: QueryRankingWithReviews;
  rankingsPizzasPromise: QueryRankingWithReviews;
}) {
  const [rankingsBurgers, rankingsDoeners, rankingsPizzas] = await Promise.all([
    rankingsBurgersPromise,
    rankingsDoenersPromise,
    rankingsPizzasPromise,
  ]);

  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-8 px-6 lg:grid-cols-3 lg:gap-x-8 lg:px-0">
      <div className="min-w-[300px] flex-shrink-0 lg:min-w-0">
        <TopByCategoryCard
          category="burger"
          rankings={rankingsBurgers.rankings}
        />
      </div>
      <div className="min-w-[300px] flex-shrink-0 lg:min-w-0">
        <TopByCategoryCard
          category="doener"
          rankings={rankingsDoeners.rankings}
        />
      </div>
      <div className="min-w-[300px] flex-shrink-0 lg:min-w-0">
        <TopByCategoryCard
          category="pizza"
          rankings={rankingsPizzas.rankings}
        />
      </div>
    </div>
  );
}

function TopByCategoryCard({
  category,
  rankings,
}: {
  category: CategoryForTop;
  rankings: RankingWithReviewsQuery[];
}) {
  const rankingOne = rankings[0];
  const rankingTwo = rankings[1];
  const rankingThree = rankings[2];
  const rankingFour = rankings[3];
  const rankingFive = rankings[4];

  return (
    <Box variant="xl" className="group overflow-hidden p-0">
      <div className="relative h-48 overflow-hidden">
        <Image
          src={categoriesForTop[category]}
          alt="Kategoriebild"
          width={300}
          height={200}
          priority
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <h3 className="absolute bottom-4 left-4 text-3xl font-extrabold capitalize tracking-tight text-white drop-shadow-md">
          {t[category]}
        </h3>
      </div>

      <div className="grid grid-cols-[min-content,1fr] grid-rows-3 place-items-center gap-y-2">
        {/* RANKING ONE */}
        {!rankingOne ? (
          <RankingCardRow position={1} ranking={null} />
        ) : (
          <RankingDrawer
            placeName={rankingOne.placeName}
            ratingAvg={rankingOne.ratingAvg}
            productName={rankingOne.productName}
            productCategory={rankingOne.productCategory}
            productNote={rankingOne.productNote}
            city={rankingOne.city}
            lastReviewedAt={rankingOne.lastReviewedAt}
            numOfReviews={rankingOne.numOfReviews}
            reviews={rankingOne.reviews}
          >
            <RankingCardRow position={1} ranking={rankingOne} />
          </RankingDrawer>
        )}

        {/* RANKING TWO */}
        {!rankingTwo ? (
          <RankingCardRow position={2} ranking={null} />
        ) : (
          <RankingDrawer
            placeName={rankingTwo.placeName}
            ratingAvg={rankingTwo.ratingAvg}
            productName={rankingTwo.productName}
            productCategory={rankingTwo.productCategory}
            productNote={rankingTwo.productNote}
            city={rankingTwo.city}
            lastReviewedAt={rankingTwo.lastReviewedAt}
            numOfReviews={rankingTwo.numOfReviews}
            reviews={rankingTwo.reviews}
          >
            <RankingCardRow position={2} ranking={rankingTwo} />
          </RankingDrawer>
        )}

        {/* RANKING THREE */}
        {!rankingThree ? (
          <RankingCardRow position={3} ranking={null} />
        ) : (
          <RankingDrawer
            placeName={rankingThree.placeName}
            ratingAvg={rankingThree.ratingAvg}
            productName={rankingThree.productName}
            productCategory={rankingThree.productCategory}
            productNote={rankingThree.productNote}
            city={rankingThree.city}
            lastReviewedAt={rankingThree.lastReviewedAt}
            numOfReviews={rankingThree.numOfReviews}
            reviews={rankingThree.reviews}
          >
            <RankingCardRow position={3} ranking={rankingThree} />
          </RankingDrawer>
        )}

        {/* RANKING FOUR */}
        {!rankingFour ? (
          <RankingCardRow position={4} ranking={null} />
        ) : (
          <RankingDrawer
            placeName={rankingFour.placeName}
            ratingAvg={rankingFour.ratingAvg}
            productName={rankingFour.productName}
            productCategory={rankingFour.productCategory}
            productNote={rankingFour.productNote}
            city={rankingFour.city}
            lastReviewedAt={rankingFour.lastReviewedAt}
            numOfReviews={rankingFour.numOfReviews}
            reviews={rankingFour.reviews}
          >
            <RankingCardRow position={4} ranking={rankingFour} />
          </RankingDrawer>
        )}

        {/* RANKING FIVE */}
        {!rankingFive ? (
          <RankingCardRow position={5} ranking={null} />
        ) : (
          <RankingDrawer
            placeName={rankingFive.placeName}
            ratingAvg={rankingFive.ratingAvg}
            productName={rankingFive.productName}
            productCategory={rankingFive.productCategory}
            productNote={rankingFive.productNote}
            city={rankingFive.city}
            lastReviewedAt={rankingFive.lastReviewedAt}
            numOfReviews={rankingFive.numOfReviews}
            reviews={rankingFive.reviews}
          >
            <RankingCardRow position={5} ranking={rankingFive} />
          </RankingDrawer>
        )}
      </div>
    </Box>
  );
}

const categoriesForTop = {
  burger: "/category-card-burger.png",
  pizza: "/category-card-pizza.png",
  doener: "/category-card-doener.png",
} as const satisfies Partial<Record<Category, string>>;
type CategoryForTop = keyof typeof categoriesForTop;

function RankingCardRow({
  position,
  ranking,
}: {
  position: 1 | 2 | 3 | 4 | 5;
  ranking: RankingWithReviewsQuery | null;
}) {
  return (
    <div className="group/ranking-card-row col-span-2 grid cursor-pointer grid-cols-subgrid py-2 hover:bg-secondary hover:text-secondary-fg">
      <div className="mx-2 lg:mx-3">
        <RankingPositionMarker
          position={position}
          labelOverwrite={
            !ranking ? (
              ""
            ) : (
              <NumberFormatted
                className="text-xl"
                num={ranking.ratingAvg}
                min={2}
                max={2}
              />
            )
          }
        />
      </div>

      <ProductDescriptionRow
        productName={ranking?.productName ?? null}
        placeName={ranking?.placeName ?? null}
        city={ranking?.city ?? null}
        showBold={position === 1}
      />
    </div>
  );
}
