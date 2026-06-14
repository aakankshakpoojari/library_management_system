# Library Management System

A simple Library Management System built using **Node.js**, **Express.js**, **EJS**, and **SQLite**.

This project allows librarians to manage books, students, borrowed books, and library visits through a web interface.

---

## Features

### Authentication
- Librarian Login
- Session-based authentication

### Dashboard
- Total Books
- Total Borrowed Books
- Total Library Visits

### Books Management
- View all books
- Add new books
- Edit existing books

### Students Management
- View students
- Add new students

### Borrowed Books
- Borrow books
- Automatic return date (15 days from borrow date)
- Return books
- Search borrowed books by title

### Library Visits
- Mark student entry
- Mark student exit
- Calculate visit duration
- Track current status (Inside / Left)

---

## Tech Stack

- Node.js
- Express.js
- EJS
- SQLite3
- Express Session
- HTML
- CSS

---

## Installation

Clone the repository:

```bash
git clone https://github.com/aakankshakpoojari/library_management_system.git
cd library-management-system
```

Install dependencies:

```bash
npm install
```

Start the application:

```bash
node app.js
```

or

```bash
nodemon app.js
```

The application will run at:

```txt
http://localhost:3000
```

---

## Login Credentials

Use the following credentials to log in:

```txt
Email: aak@gmail.com
Password: 1234
```

---

## Database

The project uses SQLite and automatically creates:

- LIBRARIANS
- STUDENTS
- BOOKS
- BORROWEDBOOKS
- LIBRARYVISITS

on first run.

---

## Project Structure

```txt
library-management-system/
│
├── public/
│   └── style.css
│
├── views/
│   ├── login.ejs
│   ├── dashboard.ejs
│   ├── books.ejs
│   ├── addBook.ejs
│   ├── editBook.ejs
│   ├── students.ejs
│   ├── addStudent.ejs
│   ├── borrowedBooks.ejs
│   ├── borrowBook.ejs
│   ├── search.ejs
│   └── visits.ejs
│
├── app.js
├── db.js
├── package.json
└── library.db
```

---

## Future Improvements

- Delete books
- Edit students
- Advanced search and filtering
- Fine calculation for overdue books
- Email reminders for return dates
- Responsive mobile UI improvements

---

didnt expect you to read till the end. but thanks :)
