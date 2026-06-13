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
app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        return res.redirect('/');
    });
});

app.listen(5000, () => {
    console.log("Running");
});