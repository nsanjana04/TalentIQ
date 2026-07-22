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

/** Python skill-path Udemy curricula (sections mirror Udemy syllabus). */
export const PYTHON_UDEMY_CURRICULA: Record<string, UdemyCurriculum> = {
  "python-101": curriculum(
    "python-101",
    "https://www.udemy.com/course/free-python-course-for-beginners/",
    [
      section("Introduction", [
        "Python Introduction",
        "Where to use Python",
        "What is Python",
        "Python Features",
        "How to Install Python - Practical",
        "Steps to Execute Python Program",
        "Python Statements Indentation and Comment",
      ]),
    ]
  ),
  "python-201": curriculum(
    "python-201",
    "https://www.udemy.com/course/python-for-intermediate-learners-2023/",
    [
      section("Introduction", ["Introduction"]),
      section("Loop Control Statements"),
      section("Sets and Dictionaries"),
      section("Exception Handling and Files"),
      section("Recursion"),
      section("Object Oriented Programming"),
      section("Searching and Sorting (Advanced)"),
    ]
  ),
  "python-301": curriculum(
    "python-301",
    "https://www.udemy.com/course/the-python-mega-course/",
    [
      section("First Steps: Capturing and Storing User Input (Variables, User Input, Lists)"),
      section("Make Your App Interactive (Methods, While Loops)"),
      section("Control Program Flow for Smart Features (Match-Case, For Loops)"),
      section("Manipulate Data (List Indexing, Tuples)"),
      section("Display and Structure Output (Enumeration, f-strings)"),
      section("Persist Data with Files (Processing Text Files, Reading/Writing)"),
      section("Optimize and Annotate Your Code (List Comprehensions, Code Comments)"),
      section("Master File Management (Context Managers, With Statement)"),
      section("Decision Making in Apps (If/Elif/Else, Dictionaries)"),
      section("Stop Your App from Crashing (Error Handling, Try-Except)"),
      section("Build a To-Do App with Functions and Dictionaries"),
      section("Web Scraping with BeautifulSoup and Requests"),
      section("Working with CSV and Excel Files"),
      section("Sending Emails with smtplib"),
      section("Image Processing with Pillow"),
      section("Data Visualization with Plotly"),
      section("Building a Web App with Flask"),
      section("REST APIs with Flask"),
      section("Desktop GUI with Tkinter"),
      section("SQL Databases with SQLite"),
      section("Deploying Python Applications"),
      section("Introduction to Data Science with Pandas"),
      section("Building AI Agents and Automations"),
      section("Final Projects and Course Wrap-Up"),
    ]
  ),
};
