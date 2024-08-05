import React, { useState, useEffect } from "react";
import axios from "axios";
import ReactPlayer from "react-player";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Alert,
  Navbar,
  Nav,
} from "react-bootstrap";
import { FaBars } from "react-icons/fa"; // Icon for hamburger menu
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css"; // Custom CSS for additional styling

function App() {
  const [mainVideo, setMainVideo] = useState(null);
  const [likes, setLikes] = useState(0);
  const [videos, setVideos] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await axios.get("http://localhost:10000/videos");
      setVideos(response.data);
      if (response.data.length > 0) {
        setMainVideo(response.data[0]);
        setLikes(response.data[0].likes);
      }
    } catch (error) {
      console.error("Error fetching videos", error);
    }
  };

  const incrementLikes = async () => {
    try {
      const response = await axios.post(
        `http://localhost:10000/video/${mainVideo._id}/like`
      );
      setLikes(response.data.likes);
    } catch (error) {
      console.error("Error updating likes", error);
    }
  };

  const handleVideoClick = (video) => {
    setMainVideo(video);
    setLikes(video.likes);
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      setUploadMessage("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("video", selectedFile);

    try {
      await axios.post("http://localhost:10000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadMessage("File uploaded successfully!");
      fetchVideos(); // Refresh the video list after upload
    } catch (error) {
      console.error("Error uploading file", error);
      setUploadMessage("Error uploading file.");
    }
  };

  return (
    <Container fluid className="App bg-dark text-white p-3">
      <Navbar
        expand="lg"
        className="mb-4"
        style={{
          backgroundImage:
            "linear-gradient(to right, black, purple, black)",
        }}
      >
        <Container>
          <Navbar.Brand href="#home" className="text-white">
            Vidtoast
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav">
            <FaBars className="text-white" />
          </Navbar.Toggle>
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ml-auto">
              <Nav.Link href="#home" className="text-white">
                Home
              </Nav.Link>
              <Nav.Link href="#upload" className="text-white">
                Upload
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Row className="justify-content-center">
        <Col md={8} className="video-player-container">
          {mainVideo ? (
            <>
              <ReactPlayer
                url={`http://localhost:10000/video/${mainVideo.filename}`}
                controls
                width="100%"
                height="100%"
                className="rounded border border-white"
              />
              <Button
                variant="outline-light"
                className="mt-2 like-button"
                onClick={incrementLikes}
              >
                Like ({likes})
              </Button>
            </>
          ) : (
            <p>Loading...</p>
          )}
        </Col>
      </Row>

      <Row className="mt-4">
        {videos.map((video) => (
          <Col key={video._id} md={3}>
            <Card
              className="bg-dark text-white"
              onClick={() => handleVideoClick(video)}
            >
              <Card.Img
                variant="top"
                src={`http://localhost:10000/${video.thumbnail}`}
                alt={video.filename}
              />
              <Card.Body>
                <Card.Title>{video.filename}</Card.Title>
                <Card.Text>Likes: {video.likes}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="mt-4 justify-content-center">
        <Col md={6}>
          <Form onSubmit={handleUpload}>
            <Form.Group>
              <Form.Label>Upload Video</Form.Label>
              <Form.Control type="file" onChange={handleFileChange} />
            </Form.Group>
            <Button type="submit" variant="outline-light" className="mt-2">
              Upload
            </Button>
            {uploadMessage && (
              <Alert variant="info" className="mt-2">
                {uploadMessage}
              </Alert>
            )}
          </Form>
        </Col>
      </Row>
    </Container>
  );
}

export default App;
