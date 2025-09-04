export interface GitHubUserData {
  login: string;
  id: number;
  avatar_url: string;
  name: string;
  bio: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
  location: string;
  company: string;
  blog: string;
  twitter_username: string;
  hireable: boolean;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
  size: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  default_branch: string;
  topics: string[];
}

export interface GitHubLanguageStats {
  [language: string]: number;
}

export interface GitHubAnalysis {
  userData: GitHubUserData;
  topLanguages: GitHubLanguageStats;
  commitFrequency: number;
  starCount: number;
  repoCount: number;
  accountAge: number;
  activityLevel: 'High' | 'Medium' | 'Low';
  expertiseAreas: string[];
  collaborationStyle: string;
  projectDiversity: string;
}

export const fetchGitHubUserData = async (accessToken: string): Promise<GitHubUserData> => {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'SyncUp-App'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching GitHub user data:', error);
    throw error;
  }
};

export const fetchGitHubRepos = async (accessToken: string, username: string): Promise<GitHubRepo[]> => {
  try {
    const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`, {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'SyncUp-App'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching GitHub repos:', error);
    throw error;
  }
};

export const analyzeGitHubProfile = async (accessToken: string): Promise<GitHubAnalysis> => {
  try {
    // Fetch user data
    const userData = await fetchGitHubUserData(accessToken);
    
    // Fetch repositories
    const repos = await fetchGitHubRepos(accessToken, userData.login);
    
    // Analyze languages
    const languageStats: GitHubLanguageStats = {};
    let totalSize = 0;
    
    repos.forEach(repo => {
      if (repo.language) {
        languageStats[repo.language] = (languageStats[repo.language] || 0) + repo.size;
        totalSize += repo.size;
      }
    });
    
    // Calculate percentages
    Object.keys(languageStats).forEach(lang => {
      languageStats[lang] = Math.round((languageStats[lang] / totalSize) * 100);
    });
    
    // Calculate commit frequency (estimate based on repo activity)
    const now = new Date();
    const activeRepos = repos.filter(repo => {
      const lastPush = new Date(repo.pushed_at);
      const daysSinceLastPush = (now.getTime() - lastPush.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceLastPush < 30; // Active in last 30 days
    });
    
    const commitFrequency = Math.min(30, Math.round(activeRepos.length * 2));
    
    // Calculate total stars
    const starCount = repos.reduce((total, repo) => total + repo.stargazers_count, 0);
    
    // Calculate account age
    const accountAge = Math.floor((now.getTime() - new Date(userData.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365));
    
    // Determine activity level
    let activityLevel: 'High' | 'Medium' | 'Low' = 'Low';
    if (activeRepos.length > 10) activityLevel = 'High';
    else if (activeRepos.length > 5) activityLevel = 'Medium';
    
    // Determine expertise areas
    const expertiseAreas: string[] = [];
    const topLanguages = Object.entries(languageStats)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([lang]) => lang);
    
    if (topLanguages.includes('JavaScript') || topLanguages.includes('TypeScript')) {
      expertiseAreas.push('Frontend Development');
    }
    if (topLanguages.includes('Python')) {
      expertiseAreas.push('Data Science/AI');
    }
    if (topLanguages.includes('Java') || topLanguages.includes('C#')) {
      expertiseAreas.push('Enterprise Development');
    }
    if (topLanguages.includes('Go') || topLanguages.includes('Rust')) {
      expertiseAreas.push('Systems Programming');
    }
    
    // Determine collaboration style
    let collaborationStyle = 'Individual';
    if (repos.some(repo => repo.forks_count > 5)) {
      collaborationStyle = 'Community Contributor';
    } else if (repos.some(repo => repo.forks_count > 0)) {
      collaborationStyle = 'Team Player';
    }
    
    // Determine project diversity
    const hasWebApps = repos.some(repo => 
      repo.topics.includes('web') || 
      repo.topics.includes('react') || 
      repo.topics.includes('vue') ||
      repo.topics.includes('angular')
    );
    const hasMobileApps = repos.some(repo => 
      repo.topics.includes('mobile') || 
      repo.topics.includes('ios') || 
      repo.topics.includes('android')
    );
    const hasAPIs = repos.some(repo => 
      repo.topics.includes('api') || 
      repo.topics.includes('backend') ||
      repo.topics.includes('server')
    );
    
    let projectDiversity = 'Specialized';
    if (hasWebApps && hasMobileApps && hasAPIs) {
      projectDiversity = 'Full-Stack Developer';
    } else if ((hasWebApps && hasAPIs) || (hasMobileApps && hasAPIs)) {
      projectDiversity = 'Multi-Platform Developer';
    } else if (hasWebApps || hasMobileApps || hasAPIs) {
      projectDiversity = 'Platform-Specific Developer';
    }
    
    return {
      userData,
      topLanguages: languageStats,
      commitFrequency,
      starCount,
      repoCount: repos.length,
      accountAge,
      activityLevel,
      expertiseAreas,
      collaborationStyle,
      projectDiversity
    };
    
  } catch (error) {
    console.error('Error analyzing GitHub profile:', error);
    throw error;
  }
};

export const getGitHubAuthUrl = (clientId: string, redirectUri: string, scope: string = 'read:user,repo'): string => {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scope,
    response_type: 'code'
  });
  
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
};
