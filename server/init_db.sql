BEGIN TRANSACTION;

DROP TABLE IF EXISTS "order_ingredients";
DROP TABLE IF EXISTS "orders";
DROP TABLE IF EXISTS "ingredient_incompatibilities";
DROP TABLE IF EXISTS "ingredient_dependencies";
DROP TABLE IF EXISTS "ingredients";
DROP TABLE IF EXISTS "sizes";
DROP TABLE IF EXISTS "basedishes";
DROP TABLE IF EXISTS "users";

CREATE TABLE IF NOT EXISTS "users" (
	"id"	INTEGER NOT NULL,
	"email"	TEXT NOT NULL,
	"name"	TEXT,
	"hash"	TEXT NOT NULL,
	"salt"	TEXT NOT NULL,
	"secret"	TEXT,
	PRIMARY KEY("id" AUTOINCREMENT)
);

CREATE TABLE IF NOT EXISTS "basedishes" (
	"id"	INTEGER NOT NULL,
	"name"	TEXT NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
);

CREATE TABLE IF NOT EXISTS "sizes" (
	"id"	INTEGER NOT NULL,
	"name"	TEXT NOT NULL,
	"price"	REAL NOT NULL,
	"max_ingredients"	INTEGER NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
);

CREATE TABLE IF NOT EXISTS "ingredients" (
	"id"	INTEGER NOT NULL,
	"name"	TEXT NOT NULL,
	"price"	REAL NOT NULL,
	"availability"	INTEGER,
	PRIMARY KEY("id" AUTOINCREMENT)
);

CREATE TABLE IF NOT EXISTS "ingredient_dependencies" (
	"ingredient_id"	INTEGER NOT NULL,
	"depends_on_id"	INTEGER NOT NULL,
	PRIMARY KEY("ingredient_id", "depends_on_id"),
	FOREIGN KEY("ingredient_id") REFERENCES "ingredients"("id"),
	FOREIGN KEY("depends_on_id") REFERENCES "ingredients"("id")
);

CREATE TABLE IF NOT EXISTS "ingredient_incompatibilities" (
	"ingredient1_id"	INTEGER NOT NULL,
	"ingredient2_id"	INTEGER NOT NULL,
	PRIMARY KEY("ingredient1_id", "ingredient2_id"),
	FOREIGN KEY("ingredient1_id") REFERENCES "ingredients"("id"),
	FOREIGN KEY("ingredient2_id") REFERENCES "ingredients"("id")
);

CREATE TABLE IF NOT EXISTS "orders" (
	"id"	INTEGER NOT NULL,
	"user_id"	INTEGER NOT NULL,
	"dish_id"	INTEGER NOT NULL,
	"size_id"	INTEGER NOT NULL,
	"total"	REAL NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("user_id") REFERENCES "users"("id"),
	FOREIGN KEY("dish_id") REFERENCES "basedishes"("id"),
	FOREIGN KEY("size_id") REFERENCES "sizes"("id")
);

CREATE TABLE IF NOT EXISTS "order_ingredients" (
	"order_id"	INTEGER NOT NULL,
	"ingredient_id"	INTEGER NOT NULL,
	PRIMARY KEY("order_id", "ingredient_id"),
	FOREIGN KEY("order_id") REFERENCES "orders"("id"),
	FOREIGN KEY("ingredient_id") REFERENCES "ingredients"("id")
);

INSERT INTO "users" VALUES (1,'alice@example.com','Alice','82f5ce57af7b366c8ce1513d3bdaf176878798a97341b8bb618f0d1a72809a2f','72e4eeb14def3b21','LXBSMDTMSP2I5XFXIYRGFVWSFI');
INSERT INTO "users" VALUES (2,'bob@example.com','Bob','cccbdbbfc37358398cbf5fe0694c72ceffa2cddbde72dd9f4f6ca29577b5a12b','a8b618c717683608','');
INSERT INTO "users" VALUES (3,'carol@example.com','Carol','7e05a583b019a4c2bc5623f992c8d90f7b96691b579a1d500260f204214ae1f1','e818f0647b4e1fe0','LXBSMDTMSP2I5XFXIYRGFVWSFI');
INSERT INTO "users" VALUES (4,'dave@example.com','Dave','a7ae0cde48dbf0d5960f6782f44d389b6e794997ca00011e5ecf6aa3fc5a2e7a','f1e2d3c4b5a69788','');

INSERT INTO "basedishes" VALUES (1,'Pizza');
INSERT INTO "basedishes" VALUES (2,'Pasta');
INSERT INTO "basedishes" VALUES (3,'Salad');

INSERT INTO "sizes" VALUES (1,'Small',5.00,3);
INSERT INTO "sizes" VALUES (2,'Medium',7.00,5);
INSERT INTO "sizes" VALUES (3,'Large',9.00,7);

INSERT INTO "ingredients" VALUES (1,'Mozzarella',1.00,3);
INSERT INTO "ingredients" VALUES (2,'Tomatoes',0.50,NULL);
INSERT INTO "ingredients" VALUES (3,'Mushrooms',0.80,3);
INSERT INTO "ingredients" VALUES (4,'Ham',1.20,2);
INSERT INTO "ingredients" VALUES (5,'Olives',0.70,NULL);
INSERT INTO "ingredients" VALUES (6,'Tuna',1.50,2);
INSERT INTO "ingredients" VALUES (7,'Eggs',1.00,NULL);
INSERT INTO "ingredients" VALUES (8,'Anchovies',1.50,1);
INSERT INTO "ingredients" VALUES (9,'Parmesan',1.20,NULL);
INSERT INTO "ingredients" VALUES (10,'Carrots',0.40,NULL);
INSERT INTO "ingredients" VALUES (11,'Potatoes',0.30,NULL);

INSERT INTO "ingredient_dependencies" VALUES (2,5);
INSERT INTO "ingredient_dependencies" VALUES (9,1);
INSERT INTO "ingredient_dependencies" VALUES (1,2);
INSERT INTO "ingredient_dependencies" VALUES (6,5);

INSERT INTO "ingredient_incompatibilities" VALUES (7,3);
INSERT INTO "ingredient_incompatibilities" VALUES (3,7);
INSERT INTO "ingredient_incompatibilities" VALUES (7,2);
INSERT INTO "ingredient_incompatibilities" VALUES (2,7);
INSERT INTO "ingredient_incompatibilities" VALUES (4,3);
INSERT INTO "ingredient_incompatibilities" VALUES (3,4);
INSERT INTO "ingredient_incompatibilities" VALUES (5,8);
INSERT INTO "ingredient_incompatibilities" VALUES (8,5);

INSERT INTO "orders" VALUES (1,1,1,1,6.20);
INSERT INTO "orders" VALUES (2,1,2,1,6.50);
INSERT INTO "orders" VALUES (3,2,2,2,9.70);
INSERT INTO "orders" VALUES (4,2,3,3,11.60);

INSERT INTO "order_ingredients" VALUES (1,2);
INSERT INTO "order_ingredients" VALUES (1,5);
INSERT INTO "order_ingredients" VALUES (2,1);
INSERT INTO "order_ingredients" VALUES (2,2);
INSERT INTO "order_ingredients" VALUES (3,3);
INSERT INTO "order_ingredients" VALUES (3,4);
INSERT INTO "order_ingredients" VALUES (3,5);
INSERT INTO "order_ingredients" VALUES (4,6);
INSERT INTO "order_ingredients" VALUES (4,5);
INSERT INTO "order_ingredients" VALUES (4,10);

COMMIT;
