/**
 * Configuration for external service redirects
 * Handles both development and production environments
 */

// Detect if we're in production based on hostname
const isProduction = () => {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  // Production hostnames
  return hostname === 'saarthix.com' || hostname.includes('saarthix.com');
};

// Get the base URL for the current environment
const getBaseUrl = () => {
  if (typeof window === 'undefined') return '';
  const basename = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';
  return basename;
};

/**
 * Get the SomethingX (main platform) URL
 */
export const getSomethingXUrl = () => {
  const basename = getBaseUrl();
  // Remove /profiling from the base URL to get SomethingX URL
  if (basename.includes('/profiling')) {
    return basename.replace('/profiling', '');
  }
  // If no basename, assume root
  return basename || '/';
};

/**
 * Get the Jobs service URL
 */
export const getJobsUrl = () => {
  const basename = getBaseUrl();
  if (basename.includes('/profiling')) {
    return basename.replace('/profiling', '/jobs');
  }
  return `${basename}/jobs`;
};

/**
 * Build a redirect URL with authentication parameters
 * @param {string} baseUrl - Base URL to redirect to
 * @param {string} route - Route path (e.g., '/apply-jobs', '/post-jobs')
 * @param {string} token - Authentication token
 * @param {object} user - User object with email, name, userType
 * @returns {string} Complete URL with query parameters
 */
export const buildRedirectUrl = (baseUrl, route = '', token, user) => {
  // Ensure baseUrl doesn't end with / and route starts with /
  let fullPath = baseUrl.replace(/\/$/, '');
  if (route) {
    fullPath += route.startsWith('/') ? route : `/${route}`;
  }

  // Build URL with query parameters
  const url = new URL(fullPath, window.location.origin);

  if (token) {
    url.searchParams.set('token', token);
  }

  if (user?.email) {
    url.searchParams.set('email', user.email);
  }

  if (user?.name) {
    url.searchParams.set('name', user.name);
  }

  if (user?.userType) {
    url.searchParams.set('userType', user.userType);
  }

  return url.toString();
};

/**
 * Redirect to SomethingX (main platform) with specific route
 * @param {string} route - Route path (e.g., '/students/job-blueprint', '/about-us')
 * @param {string} token - Authentication token (optional, from SomethingX)
 * @param {object} user - User object (optional)
 */
export const redirectToSomethingX = (route = '', token, user) => {
  try {
    // Get token from localStorage if not provided
    const somethingxToken = token || localStorage.getItem('somethingx_auth_token');
    const somethingxUserStr = localStorage.getItem('somethingx_auth_user');
    const somethingxUser = user || (somethingxUserStr ? JSON.parse(somethingxUserStr) : null);

    // Build the redirect URL
    const somethingxUrl = getSomethingXUrl();
    const redirectUrl = buildRedirectUrl(somethingxUrl, route, somethingxToken, somethingxUser);

    // Redirect
    window.location.href = redirectUrl;
  } catch (error) {
    console.error('Failed to redirect to SomethingX:', error);
    // Still redirect even if there's an error
    const somethingxUrl = getSomethingXUrl();
    const routePath = route ? `${somethingxUrl}${route.startsWith('/') ? route : `/${route}`}` : somethingxUrl;
    window.location.href = routePath;
  }
};

/**
 * Redirect to Jobs service with authentication
 * 
 * Available routes:
 * - '/apply-jobs' - For students to browse and apply to jobs
 * - '/post-jobs' - For industry to post new job openings
 * - '/manage-applications' - For industry to manage job applications
 * - '/manage-hackathons' - For industry to manage hackathons
 * - '/post-hackathons' - For industry to post new hackathons
 * - '/browse-hackathons' - For students to browse hackathons
 * - '/job-tracker' - For students to track their job applications
 * 
 * @param {string} route - Route path (e.g., '/apply-jobs', '/post-jobs', '/manage-applications')
 * @param {string} token - Authentication token
 * @param {object} user - User object
 */
export const redirectToJobs = (route, token, user) => {
  // Get token from localStorage if not provided
  const somethingxToken = token || localStorage.getItem('somethingx_auth_token');
  const somethingxUserStr = localStorage.getItem('somethingx_auth_user');
  const somethingxUser = user || (somethingxUserStr ? JSON.parse(somethingxUserStr) : null);

  const jobsUrl = getJobsUrl();
  const redirectUrl = buildRedirectUrl(jobsUrl, route, somethingxToken, somethingxUser);
  window.location.href = redirectUrl;
};
