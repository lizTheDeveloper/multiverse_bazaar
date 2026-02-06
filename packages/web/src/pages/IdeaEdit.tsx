import { useParams, useNavigate, Link } from 'react-router-dom';
import { useIdea, useUpdateIdea } from '../hooks/useIdeas';
import { IdeaForm, IdeaFormData } from '../components/ideas/IdeaForm';

export function IdeaEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: idea, isLoading, error } = useIdea(id!);
  const updateIdea = useUpdateIdea(id!);

  const handleSubmit = async (data: IdeaFormData) => {
    try {
      await updateIdea.mutateAsync(data);
      navigate(`/ideas/${id}`);
    } catch (error) {
      console.error('Failed to update idea:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-2">Loading idea...</p>
        </div>
      </div>
    );
  }

  if (error || !idea) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-800">
          Failed to load idea. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-4">
        <Link
          to={`/ideas/${id}`}
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
          Back to Idea
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Idea</h1>
        <p className="text-gray-600 mb-8">
          Update your idea details or change its status.
        </p>

        <IdeaForm
          defaultValues={{
            title: idea.title,
            description: idea.description,
            looking_for: idea.looking_for,
            status: idea.status,
          }}
          onSubmit={handleSubmit}
          isSubmitting={updateIdea.isPending}
          submitLabel="Save Changes"
          showStatusField={true}
        />

        {updateIdea.isError && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4 text-red-800">
            Failed to update idea. Please try again.
          </div>
        )}
      </div>
    </div>
  );
}
