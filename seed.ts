import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

const SAMPLE_GAMES = [
  {
    title: "ネオ・ブロック崩し (Cyber Breakout)",
    slug: "cyber-breakout",
    description: "パドルをマウスまたは矢印キーで操作し、サイバーブロックを全破壊する王道爽快アクションブロック崩しゲーム！コンボを繋げてハイスコアを狙え！",
    instructions: "【操作方法】\n← → キーまたはマウス移動：パドル操作\nスペースキー / クリック：ボール発射\nブロックを崩すとスコア獲得！落とすとライフ減少。",
    category: "action",
    thumbnailUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80",
    gameType: "html5",
    isFeatured: true,
    status: "approved",
    gameCode: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; background: #0f172a; color: #fff; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; overflow: hidden; }
    canvas { background: #020617; border: 2px solid #38bdf8; border-radius: 8px; box-shadow: 0 0 20px rgba(56, 189, 248, 0.4); }
    #ui { position: absolute; top: 12px; font-size: 18px; font-weight: bold; text-shadow: 0 0 10px #38bdf8; }
  </style>
</head>
<body>
  <div id="ui">SCORE: <span id="score">0</span> | LIVES: <span id="lives">3</span></div>
  <canvas id="game" width="600" height="420"></canvas>
  <script>
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    let score = 0, lives = 3, gameOver = false, gameWon = false;
    
    let paddle = { x: 250, y: 390, width: 100, height: 12, dx: 7 };
    let ball = { x: 300, y: 370, r: 7, dx: 4, dy: -4, active: true };
    
    const rows = 4, cols = 8;
    const brickW = 60, brickH = 18, brickPad = 10, offsetTop = 40, offsetLeft = 25;
    let bricks = [];
    const colors = ["#f43f5e", "#fb923c", "#eab308", "#10b981"];
    
    for(let r=0; r<rows; r++) {
      bricks[r] = [];
      for(let c=0; c<cols; c++) {
        bricks[r][c] = { x: 0, y: 0, status: 1, color: colors[r % colors.length] };
      }
    }

    let rightPressed = false, leftPressed = false;
    document.addEventListener("keydown", e => {
      if(e.key === "Right" || e.key === "ArrowRight") rightPressed = true;
      if(e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;
      if(gameOver || gameWon) { if(e.key === " ") document.location.reload(); }
    });
    document.addEventListener("keyup", e => {
      if(e.key === "Right" || e.key === "ArrowRight") rightPressed = false;
      if(e.key === "Left" || e.key === "ArrowLeft") leftPressed = false;
    });
    canvas.addEventListener("mousemove", e => {
      const rect = canvas.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      if(relativeX > 0 && relativeX < canvas.width) {
        paddle.x = relativeX - paddle.width / 2;
      }
    });

    function collisionDetection() {
      let activeCount = 0;
      for(let r=0; r<rows; r++) {
        for(let c=0; c<cols; c++) {
          let b = bricks[r][c];
          if(b.status === 1) {
            activeCount++;
            if(ball.x > b.x && ball.x < b.x + brickW && ball.y > b.y && ball.y < b.y + brickH) {
              ball.dy = -ball.dy;
              b.status = 0;
              score += 100;
              document.getElementById("score").innerText = score;
            }
          }
        }
      }
      if(activeCount === 0 && !gameWon) {
        gameWon = true;
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw bricks
      for(let r=0; r<rows; r++) {
        for(let c=0; c<cols; c++) {
          if(bricks[r][c].status === 1) {
            let bx = c * (brickW + brickPad) + offsetLeft;
            let by = r * (brickH + brickPad) + offsetTop;
            bricks[r][c].x = bx;
            bricks[r][c].y = by;
            ctx.beginPath();
            ctx.roundRect(bx, by, brickW, brickH, 4);
            ctx.fillStyle = bricks[r][c].color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = bricks[r][c].color;
            ctx.fill();
            ctx.closePath();
          }
        }
      }
      ctx.shadowBlur = 0;

      // Draw paddle
      ctx.beginPath();
      ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 6);
      ctx.fillStyle = "#38bdf8";
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#38bdf8";
      ctx.fill();
      ctx.closePath();

      // Draw ball
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2);
      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#ffffff";
      ctx.fill();
      ctx.closePath();
      ctx.shadowBlur = 0;

      collisionDetection();

      if(gameOver) {
        ctx.font = "bold 32px sans-serif";
        ctx.fillStyle = "#f43f5e";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", canvas.width/2, canvas.height/2);
        ctx.font = "18px sans-serif";
        ctx.fillStyle = "#fff";
        ctx.fillText("スペースキーで再スタート", canvas.width/2, canvas.height/2 + 40);
        return;
      }

      if(gameWon) {
        ctx.font = "bold 32px sans-serif";
        ctx.fillStyle = "#10b981";
        ctx.textAlign = "center";
        ctx.fillText("ALL CLEAR! CONGRATULATIONS!", canvas.width/2, canvas.height/2);
        ctx.font = "18px sans-serif";
        ctx.fillStyle = "#fff";
        ctx.fillText("スペースキーで再挑戦", canvas.width/2, canvas.height/2 + 40);
        return;
      }

      // Ball movement
      if(ball.x + ball.dx > canvas.width - ball.r || ball.x + ball.dx < ball.r) {
        ball.dx = -ball.dx;
      }
      if(ball.y + ball.dy < ball.r) {
        ball.dy = -ball.dy;
      } else if(ball.y + ball.dy > paddle.y - ball.r) {
        if(ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
          let hitPoint = (ball.x - (paddle.x + paddle.width/2)) / (paddle.width/2);
          ball.dx = hitPoint * 6;
          ball.dy = -Math.abs(ball.dy);
        } else if(ball.y + ball.dy > canvas.height - ball.r) {
          lives--;
          document.getElementById("lives").innerText = lives;
          if(lives <= 0) {
            gameOver = true;
          } else {
            ball.x = paddle.x + paddle.width/2;
            ball.y = 370;
            ball.dx = 4;
            ball.dy = -4;
          }
        }
      }

      ball.x += ball.dx;
      ball.y += ball.dy;

      if(rightPressed && paddle.x < canvas.width - paddle.width) {
        paddle.x += paddle.dx;
      } else if(leftPressed && paddle.x > 0) {
        paddle.x -= paddle.dx;
      }

      requestAnimationFrame(draw);
    }
    draw();
  </script>
</body>
</html>`
  },
  {
    title: "スピード・スネーク2026 (Speed Snake)",
    slug: "speed-snake-2026",
    description: "エサを食べてどんどん長くなるヘビを操作するレトロクラシックゲーム！壁や自分の体に当たらないように最高スコアを目指しましょう！",
    instructions: "【操作方法】\n矢印キー (↑ ↓ ← →) または WASD：ヘビの移動方向変更\nリンゴを食べるとスコア+10＆ヘビが伸びます。\n自分自身や外壁に激突するとゲームオーバー。",
    category: "retro",
    thumbnailUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80",
    gameType: "html5",
    isFeatured: true,
    status: "approved",
    gameCode: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; background: #090d16; color: #fff; font-family: monospace; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; overflow: hidden; }
    canvas { background: #131b2e; border: 3px solid #22c55e; border-radius: 8px; box-shadow: 0 0 25px rgba(34, 197, 94, 0.3); }
    #stats { margin-bottom: 12px; font-size: 20px; font-weight: bold; color: #4ade80; }
  </style>
</head>
<body>
  <div id="stats">SCORE: <span id="score">0</span></div>
  <canvas id="c" width="400" height="400"></canvas>
  <script>
    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');
    const grid = 20;
    let count = 0;
    let score = 0;
    let snake = { x: 160, y: 160, dx: grid, dy: 0, cells: [], maxCells: 4 };
    let apple = { x: 320, y: 320 };
    let gameOver = false;

    function getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min)) + min;
    }

    function resetGame() {
      score = 0;
      document.getElementById('score').innerText = score;
      snake.x = 160;
      snake.y = 160;
      snake.cells = [];
      snake.maxCells = 4;
      snake.dx = grid;
      snake.dy = 0;
      apple.x = getRandomInt(0, 20) * grid;
      apple.y = getRandomInt(0, 20) * grid;
      gameOver = false;
    }

    function loop() {
      requestAnimationFrame(loop);
      if (++count < 6) return;
      count = 0;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (gameOver) {
        ctx.fillStyle = "#ef4444";
        ctx.font = "26px monospace";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 10);
        ctx.fillStyle = "#ffffff";
        ctx.font = "16px monospace";
        ctx.fillText("Press Space or Click to Restart", canvas.width / 2, canvas.height / 2 + 30);
        return;
      }

      snake.x += snake.dx;
      snake.y += snake.dy;

      if (snake.x < 0 || snake.x >= canvas.width || snake.y < 0 || snake.y >= canvas.height) {
        gameOver = true;
      }

      snake.cells.unshift({ x: snake.x, y: snake.y });
      if (snake.cells.length > snake.maxCells) {
        snake.cells.pop();
      }

      // Draw Apple
      ctx.fillStyle = "#ef4444";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#ef4444";
      ctx.fillRect(apple.x, apple.y, grid - 1, grid - 1);
      ctx.shadowBlur = 0;

      // Draw Snake
      ctx.fillStyle = "#22c55e";
      snake.cells.forEach((cell, index) => {
        if (index === 0) ctx.fillStyle = "#86efac";
        else ctx.fillStyle = "#22c55e";
        ctx.fillRect(cell.x, cell.y, grid - 1, grid - 1);

        if (cell.x === apple.x && cell.y === apple.y) {
          snake.maxCells++;
          score += 10;
          document.getElementById('score').innerText = score;
          apple.x = getRandomInt(0, 20) * grid;
          apple.y = getRandomInt(0, 20) * grid;
        }

        for (let i = index + 1; i < snake.cells.length; i++) {
          if (cell.x === snake.cells[i].x && cell.y === snake.cells[i].y) {
            gameOver = true;
          }
        }
      });
    }

    document.addEventListener("keydown", e => {
      if (e.key === " " && gameOver) { resetGame(); return; }
      if ((e.key === "ArrowLeft" || e.key === "a") && snake.dx === 0) { snake.dx = -grid; snake.dy = 0; }
      else if ((e.key === "ArrowUp" || e.key === "w") && snake.dy === 0) { snake.dy = -grid; snake.dx = 0; }
      else if ((e.key === "ArrowRight" || e.key === "d") && snake.dx === 0) { snake.dx = grid; snake.dy = 0; }
      else if ((e.key === "ArrowDown" || e.key === "s") && snake.dy === 0) { snake.dy = grid; snake.dx = 0; }
    });
    canvas.addEventListener("click", () => { if(gameOver) resetGame(); });

    requestAnimationFrame(loop);
  </script>
</body>
</html>`
  },
  {
    title: "2048 パズル・ネオ (2048 Neo)",
    slug: "2048-neo",
    description: "数字を合体させて2048のタイルを作り出す大人気脳トレ数学パズル！シンプルながら奥深い中毒性の高いパズルゲームです。",
    instructions: "【操作方法】\n矢印キー (↑ ↓ ← →) または 画面スワイプ：タイルを一斉にスライド\n同じ数字同士が衝突すると合体して2倍になります！盤面が埋まる前に2048を目指そう！",
    category: "puzzle",
    thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
    gameType: "html5",
    isFeatured: true,
    status: "approved",
    gameCode: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; background: #1e1b4b; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; user-select: none; }
    .header { display: flex; justify-content: space-between; width: 340px; margin-bottom: 12px; align-items: center; }
    .score-box { background: #312e81; padding: 6px 14px; border-radius: 8px; font-weight: bold; border: 1px solid #4338ca; }
    #board { display: grid; grid-template-columns: repeat(4, 75px); grid-template-rows: repeat(4, 75px); gap: 10px; background: #312e81; padding: 10px; border-radius: 12px; border: 2px solid #6366f1; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .tile { width: 75px; height: 75px; background: #4338ca; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 26px; font-weight: bold; transition: all 0.1s ease; }
    .tile[data-val="2"] { background: #6366f1; color: #fff; }
    .tile[data-val="4"] { background: #818cf8; color: #fff; }
    .tile[data-val="8"] { background: #f59e0b; color: #fff; }
    .tile[data-val="16"] { background: #ea580c; color: #fff; }
    .tile[data-val="32"] { background: #ef4444; color: #fff; }
    .tile[data-val="64"] { background: #dc2626; color: #fff; font-size: 24px; }
    .tile[data-val="128"] { background: #10b981; color: #fff; font-size: 22px; box-shadow: 0 0 10px #10b981; }
    .tile[data-val="256"] { background: #06b6d4; color: #fff; font-size: 22px; box-shadow: 0 0 12px #06b6d4; }
    .tile[data-val="512"] { background: #a855f7; color: #fff; font-size: 20px; box-shadow: 0 0 15px #a855f7; }
    .tile[data-val="1024"] { background: #ec4899; color: #fff; font-size: 18px; box-shadow: 0 0 18px #ec4899; }
    .tile[data-val="2048"] { background: #facc15; color: #000; font-size: 18px; box-shadow: 0 0 25px #facc15; }
  </style>
</head>
<body>
  <div class="header">
    <h2 style="margin:0; font-size:24px; color:#818cf8;">2048 Neo</h2>
    <div class="score-box">スコア: <span id="score">0</span></div>
  </div>
  <div id="board"></div>
  <p style="font-size:12px; color:#a5b4fc; margin-top:14px;">矢印キー (↑ ↓ ← →) で操作</p>
  <script>
    let board = [
      [0,0,0,0],
      [0,0,0,0],
      [0,0,0,0],
      [0,0,0,0]
    ];
    let score = 0;

    function init() {
      board = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
      score = 0;
      addRandomTile();
      addRandomTile();
      render();
    }

    function addRandomTile() {
      let empty = [];
      for(let r=0; r<4; r++) {
        for(let c=0; c<4; c++) {
          if(board[r][c] === 0) empty.push({r, c});
        }
      }
      if(empty.length > 0) {
        let rand = empty[Math.floor(Math.random() * empty.length)];
        board[rand.r][rand.c] = Math.random() < 0.9 ? 2 : 4;
      }
    }

    function render() {
      const container = document.getElementById("board");
      container.innerHTML = "";
      for(let r=0; r<4; r++) {
        for(let c=0; c<4; c++) {
          const val = board[r][c];
          const tile = document.createElement("div");
          tile.className = "tile";
          if(val > 0) {
            tile.setAttribute("data-val", val);
            tile.innerText = val;
          }
          container.appendChild(tile);
        }
      }
      document.getElementById("score").innerText = score;
    }

    function slide(row) {
      let arr = row.filter(val => val);
      for(let i=0; i<arr.length-1; i++) {
        if(arr[i] === arr[i+1]) {
          arr[i] *= 2;
          score += arr[i];
          arr[i+1] = 0;
        }
      }
      arr = arr.filter(val => val);
      while(arr.length < 4) arr.push(0);
      return arr;
    }

    function moveLeft() {
      let changed = false;
      for(let r=0; r<4; r++) {
        let orig = [...board[r]];
        board[r] = slide(board[r]);
        if(orig.some((v, idx) => v !== board[r][idx])) changed = true;
      }
      return changed;
    }

    function rotate() {
      let next = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
      for(let r=0; r<4; r++) {
        for(let c=0; c<4; c++) {
          next[c][3-r] = board[r][c];
        }
      }
      board = next;
    }

    function move(dir) {
      let changed = false;
      if(dir === "left") changed = moveLeft();
      else if(dir === "down") { rotate(); changed = moveLeft(); rotate(); rotate(); rotate(); }
      else if(dir === "right") { rotate(); rotate(); changed = moveLeft(); rotate(); rotate(); }
      else if(dir === "up") { rotate(); rotate(); rotate(); changed = moveLeft(); rotate(); }

      if(changed) {
        addRandomTile();
        render();
      }
    }

    window.addEventListener("keydown", e => {
      if(e.key === "ArrowLeft") { e.preventDefault(); move("left"); }
      if(e.key === "ArrowRight") { e.preventDefault(); move("right"); }
      if(e.key === "ArrowUp") { e.preventDefault(); move("up"); }
      if(e.key === "ArrowDown") { e.preventDefault(); move("down"); }
    });

    init();
  </script>
</body>
</html>`
  }
];

async function seed() {
  console.log("Connecting to database...");
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  // 1. Check or insert Admin account
  const [adminRows] = await conn.execute("SELECT * FROM users WHERE username = 'admin' LIMIT 1;");
  let adminId: number;
  if ((adminRows as any[]).length === 0) {
    const adminPassHash = hashPassword("admin1234");
    const [res] = await conn.execute(
      "INSERT INTO users (openId, username, passwordHash, name, email, loginMethod, role, avatarUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        "local_admin_master",
        "admin",
        adminPassHash,
        "サイト管理者",
        "admin@gamehub.jp",
        "password",
        "admin",
        "https://api.dicebear.com/7.x/bottts/svg?seed=admin"
      ]
    );
    adminId = (res as any).insertId;
    console.log("Created admin account: admin / admin1234 (ID:", adminId, ")");
  } else {
    adminId = (adminRows as any[])[0].id;
    console.log("Admin account already exists with ID:", adminId);
  }

  // 2. Check or insert Normal user account
  const [userRows] = await conn.execute("SELECT * FROM users WHERE username = 'player1' LIMIT 1;");
  let normalUserId: number;
  if ((userRows as any[]).length === 0) {
    const userPassHash = hashPassword("user1234");
    const [res] = await conn.execute(
      "INSERT INTO users (openId, username, passwordHash, name, email, loginMethod, role, avatarUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        "local_player1",
        "player1",
        userPassHash,
        "テストクリエイター",
        "player1@gamehub.jp",
        "password",
        "user",
        "https://api.dicebear.com/7.x/bottts/svg?seed=player1"
      ]
    );
    normalUserId = (res as any).insertId;
    console.log("Created regular user account: player1 / user1234 (ID:", normalUserId, ")");
  } else {
    normalUserId = (userRows as any[])[0].id;
    console.log("Regular user account already exists with ID:", normalUserId);
  }

  // 3. Insert sample games if none exist
  const [gameRows] = await conn.execute("SELECT count(*) as count FROM games;");
  const count = (gameRows as any[])[0]?.count ?? 0;
  if (count === 0) {
    console.log("Seeding sample games...");
    for (const g of SAMPLE_GAMES) {
      await conn.execute(
        `INSERT INTO games (title, slug, description, instructions, category, thumbnailUrl, gameType, gameCode, authorId, authorName, status, isFeatured, playCount, favoriteCount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          g.title,
          g.slug,
          g.description,
          g.instructions,
          g.category,
          g.thumbnailUrl,
          g.gameType,
          g.gameCode,
          adminId,
          "公式GameHub",
          g.status,
          g.isFeatured,
          Math.floor(Math.random() * 50) + 10,
          Math.floor(Math.random() * 20) + 5
        ]
      );
    }
    console.log("Inserted 3 playable sample games!");
  } else {
    console.log("Games already seeded (count:", count, ")");
  }

  await conn.end();
  console.log("Seed completed successfully!");
}

seed().catch(err => {
  console.error("Seed error:", err);
  process.exit(1);
});
