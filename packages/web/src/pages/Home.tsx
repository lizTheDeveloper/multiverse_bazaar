import { Link, useNavigate } from 'react-router-dom';
import { Page } from '@/components/layout';
import { Button } from '@/components/ui';
import { ProjectCard } from '@/components/projects';
import { IdeaCard } from '@/components/ideas';
import { useProjects } from '@/hooks/useProjects';
import { useIdeas } from '@/hooks/useIdeas';
import { useAuth } from '@/hooks/useAuth';

export function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Fetch featured projects
  const { data: featuredProjects, isLoading: loadingProjects } = useProjects({
    is_featured: true,
    limit: 6,
  });

  // Fetch recent open ideas
  const { data: recentIdeas, isLoading: loadingIdeas } = useIdeas({
    status: 'open',
    sort: 'recent',
    limit: 4,
  });

  // Fetch all projects for stats
  const { data: allProjects } = useProjects({ limit: 1000 });

  const handlePostIdea = () => {
    if (isAuthenticated) {
      navigate('/ideas/new');
    } else {
      navigate('/login');
    }
  };

  const totalProjects = allProjects?.length || 0;
  const collaboratorsCount = allProjects?.reduce((acc, project) => {
    return acc + (project.collaborators?.length || 0);
  }, 0) || 0;
  const graduatedCount = recentIdeas?.filter(idea => idea.status === 'graduated')?.length || 0;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative container mx-auto px-4 py-24 md:py-32 max-w-7xl">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Where Multiverse Ideas Become Reality
            </h1>
            <p className="text-xl md:text-2xl mb-10 text-white/90">
              A collaborative platform where creators share ideas, find partners, and build amazing projects together across the multiverse.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/projects">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 focus:ring-white w-full sm:w-auto">
                  Browse Projects
                </Button>
              </Link>
              <Button
                size="lg"
                variant="secondary"
                onClick={handlePostIdea}
                className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border border-white/30 w-full sm:w-auto"
              >
                Share Your Idea
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <Page className="py-16">
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Featured Projects
            </h2>
            <Link
              to="/projects"
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              View All Projects
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>

          {loadingProjects && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-96 bg-gray-200 rounded-lg animate-pulse"
                />
              ))}
            </div>
          )}

          {!loadingProjects && featuredProjects && featuredProjects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}

          {!loadingProjects && (!featuredProjects || featuredProjects.length === 0) && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-4">No featured projects yet.</p>
              <Link to="/projects">
                <Button>Explore All Projects</Button>
              </Link>
            </div>
          )}
        </div>
      </Page>

      {/* Recent Ideas Section */}
      <div className="bg-gray-50 py-16">
        <Page>
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Looking for Collaborators
              </h2>
              <Link
                to="/ideas"
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                View All Ideas
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>

            {loadingIdeas && (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-48 bg-gray-200 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            )}

            {!loadingIdeas && recentIdeas && recentIdeas.length > 0 && (
              <div className="space-y-4">
                {recentIdeas.map((idea) => (
                  <IdeaCard key={idea.id} idea={idea} />
                ))}
              </div>
            )}

            {!loadingIdeas && (!recentIdeas || recentIdeas.length === 0) && (
              <div className="text-center py-12 bg-white rounded-lg">
                <p className="text-gray-600 mb-4">No ideas looking for collaborators yet.</p>
                <Button onClick={handlePostIdea}>Post the First Idea</Button>
              </div>
            )}
          </div>
        </Page>
      </div>

      {/* Stats Section */}
      <Page className="py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <div className="text-5xl font-bold text-blue-600 mb-2">
              {totalProjects}
            </div>
            <div className="text-gray-700 font-medium">Total Projects</div>
          </div>
          <div className="text-center p-8 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <div className="text-5xl font-bold text-purple-600 mb-2">
              {collaboratorsCount}
            </div>
            <div className="text-gray-700 font-medium">Collaborators</div>
          </div>
          <div className="text-center p-8 bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg">
            <div className="text-5xl font-bold text-pink-600 mb-2">
              {graduatedCount}
            </div>
            <div className="text-gray-700 font-medium">Ideas Turned Into Projects</div>
          </div>
        </div>
      </Page>

      {/* Call to Action Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <Page>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Have an idea? Share it with the community!
            </h2>
            <p className="text-xl mb-8 text-white/90">
              Connect with talented collaborators who can help bring your vision to life.
            </p>
            <Button
              size="lg"
              onClick={handlePostIdea}
              className="bg-white text-blue-600 hover:bg-gray-100 focus:ring-white"
            >
              Post an Idea
            </Button>
          </div>
        </Page>
      </div>
    </div>
  );
}
