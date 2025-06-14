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

- [ ] Build the Pipeline Overview dashboard.
  - [ ] Create a visual funnel showing deals by stage.
  - [ ] Implement a sortable deal list with search functionality.
  - [ ] Display key metrics:
    - [ ] Total pipeline value.
    - [ ] Win rate.

## Testing

- [ ] Write tests for the data ingestion endpoint.
  - [ ] Include tests for edge cases.
- [ ] Write tests for the Pipeline Analytics API.

## Documentation

- [ ] Write a README with setup instructions.
- [ ] Document AI tool usage and code improvements.
- [ ] Include architecture decisions and trade-offs.

## Sample Data

- [ ] Load and display sample data in the UI.
