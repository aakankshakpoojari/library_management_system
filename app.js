const express = require('express')
const path = require('path')
const db = require('./db')
const session = require('express-session');

const app = express();

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))

app.use(
    session({
        secret: "librarysecret",
        resave: false,
        saveUninitialized: false
    })
)

app.get("/", (req, res) => {
    res.render("login", { error: null });
});

app.post("/login", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    db.get(`SELECT * FROM LIBRARIANS WHERE EMAIL=? AND PASSWORD = ? `, [email, password], (err, row) => {
        if (row) {
            req.session.librarians = row
            return res.redirect('/dashboard');
        } else {
            res.render("login", { error: "Invalid Credentials" })
            console.log(err);
        }
    })
})

function isLoggedIn(req, res, next) {
    if (req.session.librarians) {
        next();
    }
    else {
        res.redirect('/')
    }
}

app.get('/dashboard', isLoggedIn, (req, res) => {
    db.get(`SELECT COUNT(*) AS TOTAL_BOOKS FROM BOOKS`, (err, books) => {
        db.get(`SELECT COUNT(*) AS TOTAL_BORROWED FROM BORROWEDBOOKS`, (err, borrowed) => {

            db.get(`SELECT COUNT(*) AS TOTAL_VISITS FROM LIBRARYVISITS`, (err, visits) => {
                res.render("dashboard", {
                    librarian: req.session.librarians,
                    totalBooks: books.TOTAL_BOOKS,
                    totalBorrowed: borrowed.TOTAL_BORROWED,
                    totalVisits: visits.TOTAL_VISITS
                })
            })
        })
    })
})

app.get('/books',(req,res) => {
    db.all(`SELECT * FROM BOOKS`, (err,rows) => {
        res.render("books",{books:rows})
    });
});

app.get('/books/add',(req,res) => {
    res.render("addBook");
});

app.post('/books/add',(req,res)=>{
    const title=req.body.title;
    const author=req.body.author;
    const quantity=req.body.quantity;

    db.run(`INSERT INTO BOOKS(title,author,quantity)values(?,?,?)`,[title,author,quantity],(err)=>{
        if(!err) res.redirect('/books');
        else console.log(err.message);
    })
})

app.get("/books/delete/:id",(req,res)=>{
    db.run(`DELETE FROM BOOKS WHERE ID=?`,[req.params.id],(err)=>{
        if(!err){
            res.redirect('/books');
        }
    })
})

app.get("/books/edit/:id",(req,res)=>{
    db.get(`select * from books where id=?`,[req.params.id],(err,row)=>{
        if(!err){
            res.render("editBook",{book:row});
        }
    })
})

app.post("/books/edit/:id",(req,res)=>{
    const title=req.body.title;
    const author=req.body.author;
    const quantity=req.body.quantity;

    db.run(`update books set title=? , author=? , quantity=? where id=?`,[title,author,quantity,req.params.id],(err)=>{
        if(!err) res.redirect('/books');
    })
})

app.get("/borrowedBooks", (req, res) => {

    db.all(
        `SELECT
            BorrowedBooks.*,
            Books.title
         FROM BorrowedBooks
         JOIN Books
         ON BorrowedBooks.bookid = Books.id`,
        (err, borrowedBooks) => {

            if (err) {
                return res.send("Error fetching borrowed books");
            }

            let dueToday = 0;
            let overdueBooks = 0;
            let returnedBooks = 0;

            const today = new Date().toISOString().split("T")[0];

            borrowedBooks.forEach(book => {

                if (book.status === "Returned") {
                    returnedBooks++;
                }

                if (book.return_date === today) {
                    dueToday++;
                }

                if (
                    book.return_date < today &&
                    book.status !== "Returned"
                ) {
                    overdueBooks++;
                }
            });

            res.render("borrowedBooks", {
                borrowedBooks,
                totalBorrowed: borrowedBooks.length,
                dueToday,
                overdueBooks,
                returnedBooks
            });
        }
    );

});
app.get("/borrowedBooks/search", (req, res) => {

    const title = `%${req.query.title}%`;

    db.all(
        `
        SELECT
            BORROWEDBOOKS.*,
            BOOKS.title
        FROM BORROWEDBOOKS
        JOIN BOOKS
        ON BORROWEDBOOKS.bookid = BOOKS.id
        WHERE BOOKS.title LIKE ?
        `,
        [title],
        (err, borrowedBooks) => {

            if (err) {
                console.log(err);
                return res.send("Search failed");
            }

            res.render("search", {
                borrowedBooks
            });

        }
    );

});

app.get("/students",(req,res)=>{
    db.all(`select * from students`,(err,rows)=>{
        if(!err) res.render("students",{students:rows})
            else res.send("Error finding students");
    })
})

app.get("/borrowBook",(req,res)=>{
    res.render("borrowBook");
});

app.post("/borrowBook", (req, res) => {

    const usn = req.body.usn;
    const bookid = req.body.bookid;

    db.get(
        `SELECT * FROM STUDENTS WHERE usn = ?`,
        [usn],
        (err, student) => {

            if (!student) {
                return res.send("Student not found");
            }

            db.get(
                `SELECT * FROM BOOKS WHERE id = ?`,
                [bookid],
                (err, book) => {

                    if (!book) {
                        return res.send("Book not found");
                    }

                    if (book.quantity <= 0) {
                        return res.send("Book out of stock");
                    }

                    const today = new Date();

                    const borrowDate =
                        today.toISOString().split("T")[0];

                    const returnDateObj = new Date(today);
                    returnDateObj.setDate(
                        returnDateObj.getDate() + 15
                    );

                    const returnDate =
                        returnDateObj.toISOString().split("T")[0];

                    db.run(
                        `
                        INSERT INTO BORROWEDBOOKS
                        (usn, bookid, borrow_date, return_date, status)
                        VALUES (?, ?, ?, ?, ?)
                        `,
                        [
                            usn,
                            bookid,
                            borrowDate,
                            returnDate,
                            "Borrowed"
                        ],
                        (err) => {

                            if (err) {
                                console.log(err);
                                return res.send("Borrow failed");
                            }

                            db.run(
                                `
                                UPDATE BOOKS
                                SET quantity = quantity - 1
                                WHERE id = ?
                                `,
                                [bookid],
                                (err) => {

                                    if (err) {
                                        console.log(err);
                                        return res.send("Book update failed");
                                    }

                                    res.redirect("/borrowedBooks");
                                }
                            );
                        }
                    );
                }
            );
        }
    );
});

app.post("/borrowedBooks/return/:id", (req, res) => {

    const borrowId = req.params.id;

    db.get(
        `SELECT * FROM BORROWEDBOOKS WHERE id = ?`,
        [borrowId],
        (err, record) => {

            if (err || !record) {
                return res.send("Record not found");
            }

            if (record.status === "Returned") {
                return res.redirect("/borrowedBooks");
            }

            db.run(
                `UPDATE BORROWEDBOOKS
                 SET status = 'Returned'
                 WHERE id = ?`,
                [borrowId],
                (err) => {

                    if (err) {
                        return res.send("Could not update status");
                    }

                    db.run(
                        `UPDATE BOOKS
                         SET quantity = quantity + 1
                         WHERE id = ?`,
                        [record.bookid],
                        (err) => {

                            if (err) {
                                return res.send("Could not update quantity");
                            }

                            res.redirect("/borrowedBooks");
                        }
                    );
                }
            );
        }
    );
});

app.get("/students/add", (req, res) => {
    res.render("addStudent");
});

app.post("/students/add", (req, res) => {

    const { usn, name, branch } = req.body;

    db.run(
        `
        INSERT INTO STUDENTS
        (usn, name, branch)
        VALUES (?, ?, ?)
        `,
        [usn, name, branch],
        (err) => {

            if (err) {
                console.log(err);
                return res.send("Could not add student");
            }

            res.redirect("/students");
        }
    );

});

app.get("/visits",(req,res)=>{

    db.all(
        `SELECT * FROM LIBRARYVISITS
         ORDER BY id DESC`,
        (err,visits)=>{

            if(err){
                return res.send("Error");
            }

            res.render("visits",{visits});
        }
    );
});

app.post("/visits/entry",(req,res)=>{

    const usn = req.body.usn;

    const now = new Date();

    db.run(
        `
        INSERT INTO LIBRARYVISITS
        (usn,entry_time)
        VALUES (?,?)
        `,
        [usn,now.toISOString()],
        (err)=>{

            if(err){
                console.log(err);
            }

            res.redirect("/visits");
        }
    );
});

app.post("/visits/exit",(req,res)=>{

    const usn = req.body.usn;

    db.get(
        `
        SELECT *
        FROM LIBRARYVISITS
        WHERE usn = ?
        AND exit_time IS NULL
        ORDER BY id DESC
        LIMIT 1
        `,
        [usn],
        (err,visit)=>{

            if(!visit){
                return res.send(
                    "No active visit found"
                );
            }

            const exitTime = new Date();

            const entryTime =
                new Date(visit.entry_time);

            const durationMs =
                exitTime - entryTime;

            const durationMinutes =
                Math.floor(durationMs/60000);

            db.run(
                `
                UPDATE LIBRARYVISITS
                SET
                    exit_time=?,
                    duration=?
                WHERE id=?
                `,
                [
                    exitTime.toISOString(),
                    durationMinutes + " mins",
                    visit.id
                ],
                ()=>{

                    res.redirect("/visits");
                }
            );
        }
    );
});

app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        return res.redirect('/');
    });
});

app.listen(5000, () => {
    console.log("Running");
});