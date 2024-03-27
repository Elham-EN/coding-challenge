import { buildHierarchy, displayHierarchy } from "../src/index";
import { pool } from "../src/index";

const mockEmployees = [
  { id: 100, name: "Alan", manager_id: 150 },
  { id: 220, name: "Martin", manager_id: 100 },
  { id: 150, name: "Jamie", manager_id: null },
  { id: 275, name: "Alex", manager_id: 100 },
  { id: 400, name: "Steve", manager_id: 150 },
  { id: 190, name: "David", manager_id: 400 },
];

describe("Hierarchy Building and Displaying", () => {
  afterAll(async () => {
    await pool.end(); // Close the pool connection after all tests are done
  });
  it("correctly constructs hierarchy when manager_id is null'", () => {
    // Start with CEO, manager_id = null
    const hierarchy = buildHierarchy(mockEmployees, null);
    // Assuming only one CEO
    expect(hierarchy).toHaveLength(1);
    // Check if CEO has correct number of direct reports
    expect(hierarchy[0].subordinates).toHaveLength(2);
  });

  it("should display Jamie if manager_id is null", () => {
    console.log = jest.fn();
    const hierarchy = buildHierarchy(mockEmployees, null);
    displayHierarchy(hierarchy);
    expect(console.log).toHaveBeenCalledWith("Jamie");
  });
});

describe("buildHierarchy Functionality", () => {
  test("correctly constructs hierarchy for manager_id 100", () => {
    // Call buildHierarchy with mock data and manager_id of 100
    const hierarchy = buildHierarchy(mockEmployees, 100);
    // Expectations:
    // Assuming 2 employees directly report to manager_id 100
    expect(hierarchy).toHaveLength(2);
    // Check if the correct employees are under manager_id 100
    const employeeNames = hierarchy.map((employee) => employee.name);
    expect(employeeNames).toContain("Martin");
    expect(employeeNames).toContain("Alex");
  });
});
