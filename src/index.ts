import { Pool } from "pg";

interface Employee {
  id: number;
  name: string;
  manager_id: number | null;
  subordinates?: Employee[];
}

const pool = new Pool({
  user: "postgres",
  host: "demo-postgres.cnimkqice4hd.ap-southeast-2.rds.amazonaws.com",
  password: "mypassword",
  port: 5432,
  ssl: {
    rejectUnauthorized: false,
  },
});

const initialEmployees = [
  { id: 100, name: "Alan", manager_id: 150 },
  { id: 220, name: "Martin", manager_id: 100 },
  { id: 150, name: "Jamie", manager_id: null },
  { id: 275, name: "Alex", manager_id: 100 },
  { id: 400, name: "Steve", manager_id: 150 },
  { id: 190, name: "David", manager_id: 400 },
];

// Create Database Table if doesn't exist
async function ensureDatabaseSchemaExists() {
  const client = await pool.connect();
  try {
    const tableExistsResult = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE  table_schema = 'public'
            AND    table_name   = 'employees'
          );
        `);

    const tableExists = tableExistsResult.rows[0].exists;

    if (!tableExists) {
      await client.query(`
            CREATE TABLE employees (
              id SERIAL PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              manager_id INTEGER,
              FOREIGN KEY (manager_id) REFERENCES employees(id)
            );
          `);
      console.log("Employees table created.");
    }
  } catch (error) {
    console.error("Error ensuring database schema exists:", error);
  } finally {
    client.release();
  }
}

// Insert data to database if no record exist
async function initializeDatabaseIfNeeded() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN"); // Start the transaction
    // check if table is empty
    const res = await client.query("SELECT 1 FROM employees LIMIT 1;");
    if (res.rowCount === 0) {
      console.log("Database is empty. Inserting initial data...");
      // Step 1: Insert employees without manager_id
      for (const emp of initialEmployees) {
        await client.query("INSERT INTO employees (id, name) VALUES ($1, $2);", [
          emp.id,
          emp.name,
        ] as any);
      }
      // Step 2: Update employees with their manager_id
      for (const emp of initialEmployees) {
        if (emp.manager_id !== null) {
          await client.query("UPDATE employees SET manager_id = $1 WHERE id = $2;", [
            emp.manager_id,
            emp.id,
          ]);
        }
      }
      await client.query("COMMIT"); // Commit the transaction
      console.log("Initial data inserted successfully.");
    } else {
      console.log("Database already contains data. Skipping initialization.");
      await client.query("ROLLBACK"); // Rollback, as no changes are needed
    }
  } catch (error) {
    console.error("Failed to initialize database:", error);
    await client.query("ROLLBACK"); // Rollback on error
  } finally {
    client.release();
  }
}

/**
 * Fetches all employees from the database.
 */
async function fetchEmployees(): Promise<Employee[]> {
  const res = await pool.query("SELECT * FROM employees;");
  return res.rows;
}

/**
 * Recursively builds a hierarchical structure of employees based on their manager_id.
 * @param employees - Flat list of all employees.
 * @param managerId - The manager ID to build the hierarchy under. `null` starts from the top.
 */
export function buildHierarchy(
  employees: Employee[],
  managerId: number | null
): Employee[] {
  return employees
    .filter((e) => e.manager_id === managerId)
    .map((e) => ({
      ...e,
      // Recursively find subordinates for each employee
      subordinates: buildHierarchy(employees, e.id),
    }));
}

/**
 * Recursively displays the employee hierarchy in the console.
 * @param hierarchy - Hierarchical list of employees to display.
 * @param indent - Indentation string to format the display hierarchy.
 */
export function displayHierarchy(hierarchy: Employee[], indent: string = ""): void {
  hierarchy.forEach((employee) => {
    console.log(`${indent}${employee.name}`);
    if (employee.subordinates && employee.subordinates.length) {
      displayHierarchy(employee.subordinates, indent + "  ");
    }
  });
}

/**
 *  function to fetch employees from the database, build their
 *  hierarchy, and display it.
 */
async function buildAndDisplayHierarchy() {
  const employees = await fetchEmployees();
  const companyHierarchy = buildHierarchy(employees, 100);
  displayHierarchy(companyHierarchy);
}

async function main() {
  await ensureDatabaseSchemaExists();
  await initializeDatabaseIfNeeded();
  await buildAndDisplayHierarchy();
}

main().catch(console.error);

export { pool };
