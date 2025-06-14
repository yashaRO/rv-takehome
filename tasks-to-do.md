# Milestone 1 Tasks

## Project Setup

- [ ] Set up the project structure and development environment.
  - [x] Initialize a new Next.js project with TypeScript.
  - [x] Set up a Node.js backend with TypeScript.
  - [x] Configure PostgreSQL or SQLite database.
  - [x] Install Tailwind CSS for styling.

## Backend Development

- [x] Create a data ingestion endpoint.
  - [x] Define the `DealData` interface.
  - [x] Implement logic to accept and validate deal data.
  - [x] Handle edge cases:
    - [x] Duplicate deals (same `deal_id`).
    - [x] Invalid/missing data fields.
    - [x] Dates in various formats.
    - [x] Large datasets (1000+ deals at once).

## Pipeline Analytics API

- [x] Create an endpoint to return deals by stage.
  - [x] Calculate totals and percentages for each stage.

## Frontend Development

- [x] Build the Pipeline Overview dashboard.
  - [x] Create a visual funnel showing deals by stage.
  - [x] Implement a sortable deal list with search functionality.
  - [x] Display key metrics:
    - [x] Total pipeline value.
    - [x] Win rate.

## Testing

- [x] Write tests for the data ingestion endpoint.
  - [x] Include tests for edge cases.
- [x] Write tests for the Pipeline Analytics API.

## Documentation

- [ ] Write a README with setup instructions.
- [ ] Document AI tool usage and code improvements.
- [ ] Include architecture decisions and trade-offs.

## Sample Data

- [x] Load and display sample data in the UI.
