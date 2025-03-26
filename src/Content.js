import React, { useEffect, useState, useCallback } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { onMessage, saveLikedFormSubmission, fetchLikedFormSubmissions } from './service/mockServer';

export default function Content() {

  //Initializng States
  const [toasts, setToasts] = useState([]);
  const [likedList, setLikedList] = useState([]); 
  const [dismissedIds, setDismissedIds] = useState(() => new Set()); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null);

  // Fetch liked submissions on load
  useEffect(() => {
    // here Fetching liked form submissions from localStorage when the component loads
    fetchLikedFormSubmissions()
      .then((res) => {
        setLikedList(res.formSubmissions || []); // Updating liked submissions
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message); // Handling errors if any
        setLoading(false);
      });
  }, []); // Empty dependency array makes this run once on component render

  // Listen for new submissions
  useEffect(() => {
    // Listening for new form submissions and adding them to toasts
    onMessage((formSubmission) => {
      if (!dismissedIds.has(formSubmission.id)) { // Ensure dismissed toasts are not added again
        setToasts((prev) => [...prev, formSubmission]); // Adding new toast
      }
    });
  }, [dismissedIds]); // This effect depends onlyy on dismissedIds

  // Like a submission component
  const handleLike = useCallback((formSubmission) => {
    // Mark submission as liked and save it
    saveLikedFormSubmission({ ...formSubmission, liked: true })
      .then(() => {
        setLikedList((prev) => [...prev, { ...formSubmission, liked: true }]); // Add to liked list
        setToasts((prev) => prev.filter((t) => t.id !== formSubmission.id)); // Remove from toasts
      })
      .catch((err) => alert("Failed to save: " + err.message)); // Handle any errors
  }, []); //No dependancy mean not depend on any state or props

  // Dismiss a toast
  const handleDismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id)); // Remove dismissed toast from toasts
    setDismissedIds((prev) => new Set(prev).add(id)); // Add ID to dismissed set
  }, []); 

  // Delete from liked list (locally removal)
  const handleDeleteLiked = useCallback((id) => {
    setLikedList((prev) => prev.filter((item) => item.id !== id)); // Remove from liked list
    const existing = JSON.parse(localStorage.getItem('formSubmissions')) || []; // Get existing liked submissions from localStorage
    const updated = existing.filter(item => item.id !== id); // Remove the item from storage based on id
    localStorage.setItem('formSubmissions', JSON.stringify(updated)); // Save updated list back to localStorage
  }, []); 

  
  return (
    <Box>
      <Typography variant="h5" sx={{ mt: 3, mb: 2 }}>Liked Submissions</Typography>
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">Error loading liked submissions: {error}</Alert>
      ) : (
        <Stack spacing={1}>
          {likedList.map((item) => (
            <Alert
              key={item.id}
              severity="success"
              action={
                <>
                  <Button color="inherit" size="small" onClick={() => handleDeleteLiked(item.id)}>
                    Delete
                  </Button>
                </>
              }
            >
              {item.data.firstName} {item.data.lastName} - {item.data.email}
            </Alert>
          ))}
          {likedList.length === 0 && <Typography>No liked submissions yet.</Typography>}
        </Stack>
      )}

      {toasts.map((toast) => (
        <Snackbar
          key={toast.id}
          open
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            severity="info"
            action={
              <>
                <Button color="inherit" size="small" onClick={() => handleLike(toast)}>
                  Like
                </Button>
                <Button color="inherit" size="small" onClick={() => handleDismiss(toast.id)}>
                  Dismiss
                </Button>
              </>
            }
          >
            New Submission: {toast.data.firstName} {toast.data.lastName}
          </Alert>
        </Snackbar>
      ))}
    </Box>
  );
}