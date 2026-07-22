import type { UdemyCurriculum, UdemyCurriculumSection } from "@/types/udemy-curriculum";

const CAPTURED = "2026-06-24";

function lectures(...titles: string[]) {
  return titles.map((title) => ({ title }));
}

function section(title: string, lectureTitles?: string[]): UdemyCurriculumSection {
  return {
    title,
    lectures:
      lectureTitles && lectureTitles.length > 0
        ? lectures(...lectureTitles)
        : [{ title: `Complete all lectures in "${title}" on Udemy` }],
  };
}

function curriculum(
  slug: string,
  sourceUrl: string,
  sections: UdemyCurriculumSection[]
): UdemyCurriculum {
  return { slug, sourceUrl, capturedAt: CAPTURED, sections };
}

/** IT roadmap free Udemy course curricula. */
export const ROADMAP_UDEMY_CURRICULA: Record<string, UdemyCurriculum> = {
  "python-intro-programming": curriculum(
    "python-intro-programming",
    "https://www.udemy.com/course/pythonforbeginnersintro/",
    [
      section("Up And Running With Python", [
        "Welcome to the Course!",
        "Read this before starting the course!",
      ]),
      section("All The Basics (2023)"),
      section("Thank You!"),
    ]
  ),
  "excel-for-beginners": curriculum(
    "excel-for-beginners",
    "https://www.udemy.com/course/useful-excel-for-beginners/",
    [
      section("Introduction", ["Introduction to the Course"]),
      section("Basics of Excel"),
      section("Entering Data"),
      section("Formatting"),
      section("Editing"),
      section("Saving"),
      section("Viewing"),
      section("Calculations"),
      section("Visualizing"),
      section("Analyzing"),
      section("Printing and Page Setup"),
      section("Advanced Excel Features"),
      section("Course Wrap-Up"),
    ]
  ),
  "quiz-app-html-css-js": curriculum(
    "quiz-app-html-css-js",
    "https://www.udemy.com/course/build-a-quiz-app-with-html-css-and-javascript/",
    [
      section("Introduction", [
        "Introduction and Resources",
        "Create and Style the Home Page",
        "Create and Style the Game Page",
        "Display Hard Coded Questions and Answers",
        "Display Feedback for Correct/Incorrect Answers",
        "Create Head's Up Display (HUD)",
        "Create a Progress Bar",
        "Create and Style the End Page",
        "Save High Scores in Local Storage",
        "Load and Display High Scores from Local Storage",
        "Fetch API to Load Questions from Local JSON File",
        "Fetch API to Load Questions from Open Trivia DB API",
        "Create a Spinning Loader",
        "Closing",
      ]),
    ]
  ),
  "c-programming-free": curriculum(
    "c-programming-free",
    "https://www.udemy.com/course/c-programming-for-beginners-/",
    [
      section("C Programming Language Fundamentals and Initial Setup"),
      section("Installing the Necessary Development Tools and Software"),
      section("Fundamentals of C: Writing Your First Code and Understanding Basic Syntax"),
      section("C Programming Fundamentals: Input, Output, Preprocessing, and Comments"),
      section("Variables and Data Types in C: Declaration, Initialization, and Usage"),
      section("C Operators: Performing Calculations, Comparisons, and Manipulations"),
      section("Mastering Program Flow Control with C Language Constructs"),
      section("Comprehensive Guide to Using Arrays in C Programming"),
      section("Demystifying Function Parameters, Returns, and Scope in C"),
      section("C Strings: In-Depth Guide to Character Arrays and String Functions"),
      section("Pointers in C: Memory Addresses and Indirection"),
      section("Structures and Unions in C"),
      section("Dynamic Memory Allocation in C"),
      section("File Input and Output in C"),
      section("Preprocessor Directives and Multi-File Projects"),
      section("Advanced C Topics and Best Practices"),
      section("Debugging and Testing C Programs"),
      section("Building Real-World C Applications"),
      section("Course Summary and Next Steps"),
      section("Bonus Lectures"),
    ]
  ),
  "git-expert-4-hours": curriculum(
    "git-expert-4-hours",
    "https://www.udemy.com/course/git-expert-4-hours/",
    [
      section("Introduction", [
        "Introduction to Course",
        "What is Git?",
        "Git vs GitHub",
        "Installing Git",
      ]),
      section("The Terminal"),
      section("Git Basics"),
      section("Git Branches"),
      section("GitHub"),
      section("Using Git Remotely"),
      section("Git GUI w/ SourceTree"),
      section("Goodbye"),
      section("Bonus Lectures"),
    ]
  ),
  "javascript-programming-free": curriculum(
    "javascript-programming-free",
    "https://www.udemy.com/course/free-java-script-programming-language-course-part-1/",
    [
      section("Java Script Programming Language Course Introduction", [
        "Java Script Programming Course Introduction",
        "Java Script course lectures structure",
      ]),
      section("Java Script Programming Guide"),
      section("BONUS: Java Selenium Cucumber BDD Playwright Cypress"),
    ]
  ),
  "intro-databases-sql": curriculum(
    "intro-databases-sql",
    "https://www.udemy.com/course/introduction-to-databases-and-sql-querying/",
    [
      section("Introduction to Databases"),
      section("Relational Database Concepts"),
      section("SQL SELECT Queries"),
      section("Filtering and Sorting Data"),
      section("Joins and Relationships"),
      section("Aggregations and Grouping"),
      section("Subqueries"),
      section("Data Manipulation (INSERT, UPDATE, DELETE)"),
      section("Database Design Basics"),
      section("Practice Exercises and Wrap-Up"),
    ]
  ),
  "java-multithreading": curriculum(
    "java-multithreading",
    "https://www.udemy.com/course/java-multithreading/",
    [
      section("Introduction to Multithreading"),
      section("Creating and Starting Threads"),
      section("Thread Lifecycle and States"),
      section("Synchronization and Locks"),
      section("Concurrent Collections"),
      section("Executor Framework"),
      section("Advanced Concurrency Patterns"),
      section("Course Wrap-Up"),
    ]
  ),
  "cloud-computing-aws": curriculum(
    "cloud-computing-aws",
    "https://www.udemy.com/course/cloud-computing-with-amazon-web-services/",
    [
      section("Introduction to Cloud Computing"),
      section("AWS Core Services Overview"),
      section("Compute Services (EC2, Lambda)"),
      section("Storage Services (S3, EBS)"),
      section("Networking and VPC"),
      section("Databases on AWS"),
      section("Security and IAM"),
      section("Monitoring and Billing"),
      section("Deploying Applications on AWS"),
      section("Course Summary"),
    ]
  ),
  "java-programming-free": curriculum(
    "java-programming-free",
    "https://www.udemy.com/course/easy-to-follow-java-programming/",
    [
      section("Getting Started with Java"),
      section("Java Syntax and Variables"),
      section("Control Flow and Loops"),
      section("Methods and Functions"),
      section("Object-Oriented Programming Basics"),
      section("Arrays and Collections"),
      section("Exception Handling"),
      section("File I/O in Java"),
      section("Practice Programs"),
      section("Course Wrap-Up"),
    ]
  ),
  "advanced-databases-sql": curriculum(
    "advanced-databases-sql",
    "https://www.udemy.com/course/advanced-databases-and-sql-querying/",
    [
      section("Advanced SQL Review"),
      section("Complex Joins and Subqueries"),
      section("Window Functions"),
      section("Indexing and Performance"),
      section("Stored Procedures and Functions"),
      section("Transactions and Concurrency"),
      section("Database Administration Basics"),
      section("Advanced Query Patterns"),
      section("Real-World Case Studies"),
      section("Course Wrap-Up"),
    ]
  ),
  "java-design-patterns": curriculum(
    "java-design-patterns",
    "https://www.udemy.com/course/java-design-patterns-and-architecture/",
    [
      section("Introduction to Design Patterns"),
      section("SOLID Principles"),
      section("Creational Patterns"),
      section("Structural Patterns"),
      section("Behavioral Patterns"),
      section("Architectural Patterns"),
      section("Anti-Patterns and Refactoring"),
      section("Enterprise Application Design"),
      section("Case Studies"),
      section("Course Wrap-Up"),
    ]
  ),
  "oop-cpp": curriculum(
    "oop-cpp",
    "https://www.udemy.com/course/object-oriented-programming-in-c-plus-plus/",
    [
      section("Introduction to C++ and OOP"),
      section("Classes and Objects"),
      section("Inheritance and Polymorphism"),
      section("Encapsulation and Abstraction"),
      section("Operator Overloading"),
      section("Templates and STL"),
      section("Memory Management"),
      section("Advanced OOP Concepts"),
      section("Design Patterns in C++"),
      section("Course Wrap-Up"),
    ]
  ),
  "front-end-web-dev": curriculum(
    "front-end-web-dev",
    "https://www.udemy.com/course/foundations-of-front-end-web-development/",
    [
      section("HTML Foundations"),
      section("CSS Layout and Styling"),
      section("Responsive Design"),
      section("JavaScript for the Web"),
      section("DOM Manipulation"),
      section("Frontend Tooling"),
      section("Accessibility and Performance"),
      section("Building a Portfolio Project"),
      section("Deployment Basics"),
      section("Course Wrap-Up"),
    ]
  ),
  "kali-linux-ethical-hacking": curriculum(
    "kali-linux-ethical-hacking",
    "https://www.udemy.com/course/start-kali-linux-ethical-hacking-and-penetration-testing/",
    [
      section("Introduction to Ethical Hacking"),
      section("Setting Up Kali Linux"),
      section("Reconnaissance and Scanning"),
      section("Vulnerability Assessment"),
      section("Exploitation Basics"),
      section("Post-Exploitation"),
      section("Web Application Testing"),
      section("Wireless Security"),
      section("Reporting and Legal Considerations"),
      section("Course Wrap-Up"),
    ]
  ),
  "aws-zero-to-hero": curriculum(
    "aws-zero-to-hero",
    "https://www.udemy.com/course/amazon-web-services-aws-v2/",
    [
      section("AWS Fundamentals"),
      section("IAM and Security"),
      section("EC2 and Compute"),
      section("S3 and Storage"),
      section("VPC and Networking"),
      section("RDS and Databases"),
      section("Lambda and Serverless"),
      section("CloudFormation and IaC"),
      section("Monitoring with CloudWatch"),
      section("High Availability and Scaling"),
      section("Cost Optimization"),
      section("Course Wrap-Up"),
    ]
  ),
  "intro-cloud-computing": curriculum(
    "intro-cloud-computing",
    "https://www.udemy.com/course/introduction-to-cloud-computing/",
    [
      section("What is Cloud Computing?"),
      section("Cloud Service Models (IaaS, PaaS, SaaS)"),
      section("Cloud Deployment Models"),
      section("Major Cloud Providers"),
      section("Cloud Security Fundamentals"),
      section("Migration Strategies"),
      section("Cloud Economics"),
      section("Course Wrap-Up"),
    ]
  ),
  "cyber-security-beginners": curriculum(
    "cyber-security-beginners",
    "https://www.udemy.com/course/cyber-security-course-for-beginners/",
    [
      section("Introduction to Cybersecurity"),
      section("Threat Landscape"),
      section("Network Security Basics"),
      section("Cryptography Fundamentals"),
      section("Identity and Access Management"),
      section("Security Operations"),
      section("Incident Response"),
      section("Security Policies and Compliance"),
      section("Hands-On Labs"),
      section("Career Paths in Cybersecurity"),
    ]
  ),
  "html-css-programming-free": curriculum(
    "html-css-programming-free",
    "https://www.udemy.com/course/html-and-css-for-beginners-crash-course-learn-fast-easy/",
    [
      section("HTML Basics"),
      section("HTML Semantic Elements"),
      section("CSS Selectors and Properties"),
      section("Box Model and Layout"),
      section("Flexbox"),
      section("CSS Grid"),
      section("Responsive Web Design"),
      section("Building a Landing Page"),
      section("Course Wrap-Up"),
    ]
  ),
  "python-beginner-intermediate-30min": curriculum(
    "python-beginner-intermediate-30min",
    "https://www.udemy.com/course/python-from-beginner-to-intermediate-in-30-minutes/",
    [
      section("Introduction to Python Programming"),
      section("Modules and Functions in Python"),
      section("Strings in Python"),
      section("Sequences & Slicing in Python"),
      section("Conditional Statements in Python"),
      section("Loop Statements in Python"),
      section("Functions in Python"),
      section("Object Oriented Programming"),
      section("File Handling in Python"),
    ]
  ),
};
