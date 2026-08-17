CREATE TABLE "place_cities" (
	"place_id" integer NOT NULL,
	"city" varchar(255) NOT NULL,
	CONSTRAINT "place_cities_place_id_city_pk" PRIMARY KEY("place_id","city")
);
--> statement-breakpoint
ALTER TABLE "place_cities" ADD CONSTRAINT "place_cities_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT INTO "place_cities" ("place_id", "city")
SELECT "id", "city" FROM "places" WHERE "city" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "places" DROP COLUMN "city";
