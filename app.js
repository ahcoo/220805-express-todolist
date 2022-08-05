// app.js
import express, { query } from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import axios from "axios";

const app = express();

app.use(cors());
app.use(express.json());

const port = 4000;
const pool = mysql.createPool({
  host: "localhost",
  user: "sbsst",
  password: "sbs123414",
  database: "a9",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const getData = async () => {
  const data = await axios.get("http://localhost:3000/todos");
};

app.get("/todos/:id/:contentId", async (req, res) => {
  // params 여러개 받기
  const data = {
    todos: {
      id: req.params.id,
      contentId: req.params.contentId,
    },
  };

  const {
    todos: { id, contentId },
  } = data;
});

app.get("/todos", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM todo ORDER BY id DESC");
  //getData()
  res.json(rows);
});

app.post("/todos", async (req, res) => {
  const {
    body: { text },
  } = req;
  await pool.query(
    `
  INSERT INTO todo
  SET reg_date = NOW(),
  perform_date = '2022-05-18 07:00:00',
  checked = 0,
  text = ?;
  `,
    [text]
  );
  const [[rows]] = await pool.query(`
  SELECT *
  FROM todo
  ORDER BY id
  DESC LIMIT 1
  `);
  res.json(rows);
});

app.get("/todos/:id/", async (req, res) => {
  //const id = req.params.id;
  const { id } = req.params;

  const [rows] = await pool.query(
    `
  SELECT *
  FROM todo
  WHERE id = ?
  `,
    [id]
  );
  if (rows.length === 0) {
    res.status(404).json({
      msg: "not found",
    });
    return;
  }

  res.json(rows[0]);
});

app.patch("/todos/:id", async (req, res) => {
  const { id } = req.params;
  const { perform_date, text } = req.body;

  const [rows] = await pool.query(
    `
    SELECT *
    FROM todo
    WHERE id = ?
    `,
    [id]
  );

  if (rows.length === 0) {
    res.status(404).json({
      msg: "not found",
    });
  }

  if (!perform_date) {
    res.status(400).json({
      msg: "perform_date required",
    });
    return;
  }

  if (!text) {
    res.status(400).json({
      msg: "text required",
    });
    return;
  }

  const [rs] = await pool.query(
    `
    UPDATE todo
    SET perform_date = ?,
    text = ?
    WHERE id = ?
    `,
    [perform_date, text, id]
  );

  res.json({
    msg: `${id}번 할일이 수정되었습니다.`,
  });
});

//todos/check 링크에서 할일인 backend 작업
app.patch("/todos/check/:id", async (req, res) => {
  //id값 받아오기
  const { id } = req.params;
  //row 세로 : 컬럼 , row : 내용
  //할 일의 check 초기상태를 체크해야 함
  const [[rows]] = await pool.query(
    `
    SELECT *
  FROM todo where id = ?
  `,
    //↓↓ ?에는 id가 들어가야 함
    [id]
  );
  //↓↓ 하지만 id에 없는 id값이 들어온다면 에러처리를 해야 함.
  if (!rows) {
    res.status(404).json({
      msg: "not found",
    });
    return;
  }
  //↓↓ 문제가 없다면 수정을 해줘야 함 → 수정하는 mySQL 구문 작성
  await pool.query(
    `
  UPDATE todo
  SET checked = ?
  WHERE id = ?
  `,
    //불러온 다음 체크가 됐다면 체크를 풀고, 체크가 안됐다면 체크를 해줘야 함 → !로 변경
    [!rows.checked, id]
  );
  res.send(id);
}); /**/

app.delete("/todos/:id", async (req, res) => {
  const { id } = req.params;

  const [[todoRow]] = await pool.query(
    `
    SELECT *
    FROM todo
    WHERE id = ?`,
    [id]
  );

  if (todoRow === undefined) {
    res.status(404).json({
      msg: "not found",
    });
    return;
  }

  const [rs] = await pool.query(
    `DELETE FROM todo
    WHERE id = ?`,
    [id]
  );
  res.json({
    msg: `${id}번 할일이 삭제되었습니다.`,
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
