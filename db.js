const sqlite3 = require("sqlite3");

const db = new sqlite3.Database("library.db", (err) => {
    if (err) {
        console.log(err.message);
    } else {
        console.log("Database connected");
    }
});

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS LIBRARIANS(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    `);

    
    db.run(`
        CREATE TABLE IF NOT EXISTS STUDENTS(
            usn TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            branch TEXT NOT NULL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS BOOKS(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            quantity INTEGER DEFAULT 0
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS BORROWEDBOOKS(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usn TEXT,
            bookid INTEGER,
            borrow_date TEXT,
            return_date TEXT,
            status TEXT,
            FOREIGN KEY(usn) REFERENCES STUDENTS(usn),
            FOREIGN KEY(bookid) REFERENCES BOOKS(id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS LIBRARYVISITS(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usn TEXT,
            entry_time TEXT,
            exit_time TEXT,
            duration TEXT,
            FOREIGN KEY(usn) REFERENCES STUDENTS(usn)
        )
    `);
/*
    db.run(`
        INSERT INTO LIBRARIANS(name,email,password)
        VALUES
        ('Aakanksha Poojari','aak@gmail.com','1234')
    `);

    db.run(`
        INSERT INTO STUDENTS(usn,name,branch)
        VALUES
        ('NNM24CS001','Aditya Karkera','CSE'),
        ('NNM24CS002','Atmika Nayak','CSE'),
        ('NNM24CS003','Rakesh Shetty','ISE'),
        ('NNM24CS004','Akshay Kumar','ISE'),
        ('NNM24CS005','Govinda Rao','ECE'),
        ('NNM24CS006','Shyam Prasad','CSE')
    `);

    db.run(`
        INSERT INTO BOOKS(title,author,quantity)
        VALUES
        ('Clean Code','Robert C. Martin',5),
        ('Introduction to Algorithms','Thomas H. Cormen',3),
        ('Database System Concepts','Abraham Silberschatz',4),
        ('Operating System Concepts','Galvin',6),
        ('Computer Networks','Andrew Tanenbaum',2)
    `);

    db.run(`
        INSERT INTO BORROWEDBOOKS
        (usn,bookid,borrow_date,return_date,status)
        VALUES
        ('NNM24CS001',1,'2026-06-01','2026-06-16','Returned'),
        ('NNM24CS002',3,'2026-06-05','2026-06-20','Borrowed'),
        ('NNM24CS004',2,'2026-06-07','2026-06-22','Borrowed')
    `);

    db.run(`
        INSERT INTO LIBRARYVISITS
        (usn,entry_time,exit_time,duration)
        VALUES
        ('NNM24CS001','09:00','11:00','2 Hours'),
        ('NNM24CS002','10:30','12:00','1.5 Hours'),
        ('NNM24CS003','08:45','10:15','1.5 Hours')
    `);*/

    console.log("Database initialized successfully");
});

module.exports = db;