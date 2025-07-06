#!/bin/bash
sqlite3 restaurant.db < init_db.sql
echo "Database setup completed!"
