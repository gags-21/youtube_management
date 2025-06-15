<script setup>
import { ref, onMounted } from "vue";
import {
  getVideoComments,
  postComment,
  replyToComment,
  getVideoDetails,
  updateVideoDetails,
  deleteComment,
} from "@/data/youtube_api";

const video = ref(null);
const isEditing = ref(false);
const editedVideo = ref({
  title: "",
  description: "",
});
const videoId = "P2dvX-h2C88";

const formatNumber = (num) => parseInt(num).toLocaleString();
const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const deleteExistingComment = async (commentId) => {
  if (confirm("Are you sure you want to delete this comment?")) {
    try {
      await deleteComment(commentId);
      comments.value = comments.value.filter((c) => c.id !== commentId);
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  }
};

const loadVideo = async () => {
  try {
    const data = await getVideoDetails(videoId);
    video.value = data;
    editedVideo.value.title = data.snippet.title;
    editedVideo.value.description = data.snippet.description;
  } catch (err) {
    console.error("Error fetching video:", err);
  }
};

const toggleEdit = () => {
  isEditing.value = !isEditing.value;
};

const saveChanges = async () => {
  try {
    await updateVideoDetails(videoId, editedVideo.value);
    video.value.snippet.title = editedVideo.value.title;
    video.value.snippet.description = editedVideo.value.description;
    isEditing.value = false;
    alert("Changes saved!");
  } catch (err) {
    console.error("Failed to save:", err);
  }
};

//comments
const newCommentText = ref("");
const comments = ref([]);

const addComment = async () => {
  if (!newCommentText.value.trim()) return;

  try {
    await postComment(videoId, newCommentText.value.trim());
    newCommentText.value = "";
    await loadComments(); 
  } catch (err) {
    console.error("Failed to add comment:", err);
  }
};

const replyToCommented = async (commentId, text) => {
  if (!text.trim()) return;

  try {
    await replyToComment(commentId, text.trim());
    await loadComments();
  } catch (err) {
    console.error("Reply failed:", err);
  }
};
const loadComments = async () => {
  try {
    const raw = await getVideoComments(videoId);
    comments.value = raw.map((c) => ({
      ...c,
      replyText: "",
    }));
  } catch (err) {
    console.error("Error loading comments:", err);
  }
};

onMounted(() => {
  loadVideo();
  loadComments();
});
</script>

<template>
  <div class="container" v-if="video">
    <div style="display: flex; flex-direction: column">
      <!-- Thumbnail -->
      <div class="thumbnail">
        <img :src="video.snippet.thumbnails.high.url" alt="Video Thumbnail" />
      </div>

      <!-- Static Info -->
      <div class="info">
        <p>
          <strong>Views:</strong> {{ formatNumber(video.statistics.viewCount) }}
        </p>
        <p>
          <strong>Upload Date:</strong>
          {{ formatDate(video.snippet.publishedAt) }}
        </p>
        <p>
          <strong>Comments:</strong>
          {{ formatNumber(video.statistics.commentCount) }}
        </p>
      </div>
    </div>

    <!-- Editable Fields -->
    <div class="editables">
      <div class="field">
        <label>Title</label>
        <input
          v-model="editedVideo.title"
          :readonly="!isEditing"
          class="input"
        />
      </div>

      <div class="field">
        <label>Description</label>
        <textarea
          v-model="editedVideo.description"
          rows="4"
          :readonly="!isEditing"
          class="textarea"
        ></textarea>
      </div>

      <!-- Actions -->
      <div class="actions">
        <button @click="toggleEdit" v-if="!isEditing">Edit</button>
        <button @click="saveChanges" v-else>Save</button>
      </div>
    </div>
  </div>

  <div v-else class="loading">Loading video...</div>

  <div class="container" v-if="video">
    <!-- Add New Comment -->
    <div class="new-comment">
      <h2>Add a Comment</h2>
      <textarea
        v-model="newCommentText"
        placeholder="Write your comment..."
        rows="3"
        class="textarea"
      ></textarea>
      <button @click="addComment">Post Comment</button>
    </div>

    <!-- Comments List -->
    <div>
      <h2 style="margin: 24px 0 16px">Comments</h2>
      <div v-for="comment in comments" :key="comment.id" class="comment-card">
        <div class="comment-header">
          <img
            :src="comment.snippet.topLevelComment.snippet.authorProfileImageUrl"
            class="avatar"
            alt="Author Avatar"
          />
          <div class="comment-meta">
            <div class="author">
              {{ comment.snippet.topLevelComment.snippet.authorDisplayName }}
            </div>
            <div class="date">
              {{
                formatDate(comment.snippet.topLevelComment.snippet.publishedAt)
              }}
            </div>
          </div>
        </div>

        <div class="comment-body">
          {{ comment.snippet.topLevelComment.snippet.textDisplay }}
        </div>

        <!-- delete -->
        <div class="actions">
          <button
            style="background-color: red"
            @click="deleteExistingComment(comment.id)"
          >
            Delete
          </button>
        </div>

        <div class="reply-box">
          <textarea
            v-model="comment.replyText"
            placeholder="Write a reply..."
            rows="2"
            class="textarea"
          ></textarea>
          <button @click="replyToCommented(comment.id, comment.replyText)">
            Reply
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: row;
  gap: 30px;
  max-width: 100%;
  margin: 40px auto;
  padding: 24px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  font-family: "Segoe UI", sans-serif;
  color: #333;
}

.editables {
  width: 50%;
}

@media (max-width: 768px) {
  .container {
    flex-direction: column;
    padding: 16px;
  }
  .editables {
    width: 100%;
  }
}

.thumbnail {
  width: 100%;
  overflow: hidden;
  border-radius: 10px;
  margin-bottom: 24px;
}

.thumbnail img {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 10px;
  object-fit: cover;
}

.field {
  margin-bottom: 20px;
}

label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 6px;
  color: #444;
}

.input,
.textarea {
  width: 100%;
  padding: 10px 12px;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  background-color: #f9f9f9;
  transition: border 0.3s;
}

.input[readonly],
.textarea[readonly] {
  background-color: #f0f0f0;
  color: #666;
}

.input:focus,
.textarea:focus {
  border-color: #2684ff;
  outline: none;
  background-color: #fff;
}

.info {
  margin-top: 24px;
  font-size: 0.95rem;
  line-height: 1.6;
}

.actions {
  margin-top: 24px;
  margin-bottom: 18px;
}

button {
  padding: 10px 20px;
  background-color: #2684ff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.25s;
}

button:hover {
  background-color: #1a66cc;
}

.loading {
  text-align: center;
  margin-top: 80px;
  font-size: 1.2rem;
  color: #666;
}

/* comments */
.comment-card {
  width: 100%;
  padding: 16px;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 16px;
  background: #fafafa;
}

.comment-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  margin-right: 12px;
}

.comment-meta {
  font-size: 0.9rem;
}

.author {
  font-weight: 600;
}

.date {
  font-size: 0.8rem;
  color: #888;
}

.comment-body {
  margin: 8px 0 12px;
  font-size: 0.95rem;
  line-height: 1.5;
}

.reply-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reply-box .textarea {
  width: 100%;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 0.9rem;
  resize: vertical;
}

.reply-box button {
  align-self: flex-end;
  padding: 6px 12px;
  font-size: 0.9rem;
  background-color: #2684ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.reply-box button:hover {
  background-color: #1a66cc;
}
.new-comment {
  margin-bottom: 24px;
  background: #fff;
  border: 1px solid #ddd;
  padding: 16px;
  border-radius: 8px;
}

.new-comment h2 {
  margin-bottom: 12px;
}

.new-comment .textarea {
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
  resize: vertical;
  font-size: 0.95rem;
  margin-bottom: 8px;
}

.new-comment button {
  padding: 8px 14px;
  font-size: 0.9rem;
  background-color: #1a73e8;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.new-comment button:hover {
  background-color: #155cb0;
}
</style>
