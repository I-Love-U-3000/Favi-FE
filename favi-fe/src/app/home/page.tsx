import Dock from "@/components/Dock";
import Post from "@/components/Post";

export default function HomePage() {
  // Mock data with free Unsplash images
  const posts = [
    {
      username: "alice",
      avatar: "https://i.pravatar.cc/150?img=1",
      image: "https://i.pinimg.com/736x/af/b6/35/afb635774bcb37dc5b12b7960c03bbee.jpg",
      caption: "Enjoying the beauty of nature 🌿",
      id: "1", // Added id for navigation
    },
    {
      username: "bob",
      avatar: "https://i.pravatar.cc/150?img=2",
      image: "https://i.pinimg.com/736x/af/b6/35/afb635774bcb37dc5b12b7960c03bbee.jpg",
      caption: "City vibes 🏙️",
      id: "2", // Added id for navigation
    },
    {
      username: "charlie",
      avatar: "https://i.pravatar.cc/150?img=3",
      image: "https://i.pinimg.com/736x/af/b6/35/afb635774bcb37dc5b12b7960c03bbee.jpg",
      caption: "Beach day 🏖️",
      id: "3", // Added id for navigation
    },
  ];

  return (
    <div className="flex bg-gray-100 min-h-screen">
      {/* Dock cố định giữa bên trái */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2">
        <Dock />
      </div>

      {/* Content chính */}
      <main className="flex-1 flex flex-col items-center p-6 ml-24">
        {posts.map((post, idx) => (
          <Post key={idx} {...post} />
        ))}
      </main>
    </div>
  );
}