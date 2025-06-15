## 🔗 YouTube Video Management App

CREATE TABLE logs (
  id SERIAL PRIMARY KEY,
  level TEXT NOT NULL,   -- info, error, warn
  message TEXT NOT NULL,     -- event message
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

APIs

GET /auth/google

GET /oauth2callback

GET /api/youtube/video/:id

PUT /api/youtube/video/:id

GET /api/youtube/comments/:videoId

POST /api/youtube/video/:id/comment

POST /api/youtube/comment/:id/reply

DELETE /api/youtube/comment/:id


## VIDEO - 

[video demo link](https://drive.google.com/file/d/1DMCqv7sMaWlrYQjdDEq7ZnkBm0geUioz/view?usp=sharing)
