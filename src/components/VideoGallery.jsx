import React from 'react';
import { useState } from 'react';
import { Play, X } from 'lucide-react';

const videos = [
  {
    title: 'Viajes por Chile: Región de la Araucanía',
    description: 'Descubre los lugares más impresionantes de la región',
    thumbnail: 'https://img.youtube.com/vi/AlhznqqpaAk/maxresdefault.jpg',
    youtubeId: 'AlhznqqpaAk',
  },
  {
    title: '3 Lugares impresionantes de la Araucanía',
    description: 'Vive la magia de los paisajes únicos del sur de Chile',
    thumbnail: 'https://img.youtube.com/vi/4aV7pCbHtlw/maxresdefault.jpg',
    youtubeId: '4aV7pCbHtlw',
  },
];

const VideoGallery = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);

  return (
    <>
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-emerald-900 mb-4">
              Vive la Experiencia
            </h2>
            <p className="text-xl text-emerald-700 max-w-2xl mx-auto">
              Hacemos cada viaje memorable
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {videos.map((video, index) => (
              <div
                key={index}
                className="group cursor-pointer"
                onClick={() => setSelectedVideo(video)}
              >
                <div className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  {/* Thumbnail desde YouTube */}
                  <div className="relative h-56">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />

                    {/* Dark overlay */}
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors duration-300" />

                    {/* Play button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-emerald-600 group-hover:bg-emerald-500 w-16 h-16 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-all duration-300 shadow-xl">
                        <Play className="text-white ml-1" size={28} fill="white" />
                      </div>
                    </div>

                    {/* YouTube badge */}
                    <div className="absolute bottom-3 right-3 bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
                      ▶ YouTube
                    </div>
                  </div>

                  {/* Content */}
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6">
                    <h3 className="text-lg font-bold text-emerald-900 mb-2">
                      {video.title}
                    </h3>
                    <p className="text-emerald-700 text-sm">
                      {video.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="relative w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute -top-12 right-0 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors"
              aria-label="Cerrar video"
            >
              <X size={24} />
            </button>

            {/* Video YouTube embed */}
            <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1`}
                title={selectedVideo.title}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Video info */}
            <div className="mt-4 text-white text-center">
              <h3 className="text-2xl font-bold mb-2">{selectedVideo.title}</h3>
              <p className="text-emerald-300">{selectedVideo.description}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VideoGallery;