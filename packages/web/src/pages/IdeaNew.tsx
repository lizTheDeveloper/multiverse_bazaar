import { useNavigate, Link } from 'react-router-dom';
import { useCreateIdea } from '../hooks/useIdeas';
import { IdeaForm, IdeaFormData } from '../components/ideas/IdeaForm';

export function IdeaNew() {
  const navigate = useNavigate();
  const createIdea = useCreateIdea();

  const handleSubmit = async (data: IdeaFormData) => {
    try {
      const idea = await createIdea.mutateAsync({
        title: data.title,
        description: data.description,
        looking_for: data.looking_for,
      });
      navigate(`/ideas/${idea.id}`);
    } catch (error) {
      console.error('Failed to create idea:', error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-4">
        <Link
          to="/ideas"
          className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Ideas
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Post an Idea</h1>
        <p className="text-gray-600 mb-8">
          Share your idea and find collaborators to help bring it to life. Be specific about
          what you're looking for.
        </p>

        <IdeaForm
          onSubmit={handleSubmit}
          isSubmitting={createIdea.isPending}
          submitLabel="Post Idea"
        />

        {createIdea.isError && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4 text-red-800">
            Failed to create idea. Please try again.
          </div>
        )}
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="font-semibold text-blue-900 mb-2">Tips for posting an idea</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
          <li>Be clear and concise about your idea</li>
          <li>Explain the problem you're trying to solve</li>
          <li>Specify exactly what skills or help you need</li>
          <li>Be open to feedback and collaboration</li>
          <li>Once you find collaborators, you can graduate your idea to a project</li>
        </ul>
      </div>
    </div>
  );
}
