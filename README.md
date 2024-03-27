# Coding Challenge

Completed the task.

At first i wanted to setup Docker but that would be too much hassle for small demo.
Instead the database is hosted on AWS RDS service for demo purposes and for limited time.

I followed good code pracetice, using transaction for dealing with multiple operations, exception handling, asynchrnous operation, Working with Raw Query using PostgreSQL and at last Single Responsibility Principl & modular.

Don't worry i took care most of the hassle here:
If database table doesn't exist, will be created by node.js app
If no record exist in the table, will be inserted by node.js app

## Instruction to run the app
