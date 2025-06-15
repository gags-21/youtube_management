import axios from "axios";

const BASE_URL = "http://localhost:3000/api/youtube";

//Get video details
export const getVideoDetails = async (videoId) => {
  const res = await axios.get(`${BASE_URL}/video/${videoId}`);
  return res.data;
};

//Update video title and description
export const updateVideoDetails = async (videoId, updatedData) => {
  const res = await axios.put(`${BASE_URL}/video/${videoId}`, {
    title: updatedData.title,
    description: updatedData.description,
  });
  return res.data;
};

// get comments
export const getVideoComments = async (videoId) => {
  const res = await axios.get(
    `http://localhost:3000/api/youtube/comments/${videoId}`
  );
  return res.data;
};

//Post a comment on the video
export const postComment = async (videoId, text) => {
  const res = await axios.post(`${BASE_URL}/video/${videoId}/comment`, {
    text,
  });
  return res.data;
};

//Reply to a comment
export const replyToComment = async (commentId, text) => {
  const res = await axios.post(`${BASE_URL}/comment/${commentId}/reply`, {
    text,
  });
  return res.data;
};

//Delete a comment
export const deleteComment = async (commentId) => {
  const res = await axios.delete(`${BASE_URL}/comment/${commentId}`);
  return res.data;
};
