export default function ArcDemo() {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Twitter Arc Demo</h1>
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <iframe
            src="/arc/index.html"
            className="w-full h-[800px] border-0"
            title="Twitter Arc Demo"
          />
        </div>
      </div>
    </div>
  )
} 