import { useDeferredValue, useEffect, useState } from "react";
import { api, getApiError } from "../api/client";
import { ErrorState } from "../components/ErrorState";
import { ExpertCard } from "../components/ExpertCard";
import { Loader } from "../components/Loader";
import { Pagination } from "../components/Pagination";
import { loadFavorites, loadRecentExperts, toggleFavoriteId } from "../utils/localState";

export function ExpertsPage() {
  const [experts, setExperts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, categories: [], languages: [] });
  const [query, setQuery] = useState({
    search: "",
    category: "",
    language: "",
    minRating: "",
    maxPrice: "",
    sortBy: "top-rated",
    featured: false,
    page: 1
  });
  const [favoriteIds, setFavoriteIds] = useState(loadFavorites);
  const [recentExperts, setRecentExperts] = useState(loadRecentExperts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState(null);
  const deferredSearch = useDeferredValue(query.search);

  const fetchExperts = async () => {
    try {
      setLoading(true);
      setError("");

      const [expertsResponse, overviewResponse] = await Promise.all([
        api.get("/experts", {
          params: {
            page: query.page,
            search: deferredSearch,
            category: query.category,
            language: query.language,
            minRating: query.minRating,
            maxPrice: query.maxPrice,
            sortBy: query.sortBy,
            featured: query.featured
          }
        }),
        api.get("/bookings/overview/stats")
      ]);

      setExperts(expertsResponse.data.data);
      setMeta(expertsResponse.data.meta);
      setOverview(overviewResponse.data);
      setRecentExperts(loadRecentExperts());
    } catch (requestError) {
      setError(getApiError(requestError, "We could not load the expert directory."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperts();
  }, [
    query.page,
    query.category,
    query.language,
    query.minRating,
    query.maxPrice,
    query.sortBy,
    query.featured,
    deferredSearch
  ]);

  const toggleFavorite = (expertId) => {
    setFavoriteIds(toggleFavoriteId(expertId));
  };

  return (
    <div className="page-stack">
      <section className="atlas-panel atlas-hero">
        <div className="atlas-hero-copy">
          <p className="eyebrow">Expert orchestration layer</p>
          <h1>Run expert sessions with Atlas-style visibility and zero booking collisions.</h1>
          <p className="hero-copy">
            Search across specialties, monitor live slot health, build a saved expert shortlist, and
            use waitlist and reschedule flows that feel like a real product instead of a static form.
          </p>
          <div className="atlas-inline-pills">
            <span>Real-time slot sync</span>
            <span>Waitlist recovery</span>
            <span>Review-backed discovery</span>
          </div>
        </div>

        <div className="hero-metrics-grid">
          <article className="metric-card">
            <span>Total bookings</span>
            <strong>{overview?.totalBookings ?? 0}</strong>
          </article>
          <article className="metric-card">
            <span>Waitlist entries</span>
            <strong>{overview?.waitlistCount ?? 0}</strong>
          </article>
          <article className="metric-card">
            <span>Featured experts</span>
            <strong>{experts.filter((expert) => expert.featured).length}</strong>
          </article>
          <article className="metric-card">
            <span>Saved experts</span>
            <strong>{favoriteIds.length}</strong>
          </article>
        </div>
      </section>

      <section className="atlas-panel filter-panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Filter graph</p>
            <h2>Find the right advisor faster</h2>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              setQuery({
                search: "",
                category: "",
                language: "",
                minRating: "",
                maxPrice: "",
                sortBy: "top-rated",
                featured: false,
                page: 1
              })
            }
          >
            Reset filters
          </button>
        </div>

        <div className="atlas-filter-grid">
          <label className="field-block">
            <span>Search expert</span>
            <input
              type="search"
              value={query.search}
              onChange={(event) =>
                setQuery((current) => ({ ...current, search: event.target.value, page: 1 }))
              }
              placeholder="Name, focus area, headline"
            />
          </label>

          <label className="field-block">
            <span>Category</span>
            <select
              value={query.category}
              onChange={(event) =>
                setQuery((current) => ({ ...current, category: event.target.value, page: 1 }))
              }
            >
              <option value="">All categories</option>
              {meta.categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="field-block">
            <span>Language</span>
            <select
              value={query.language}
              onChange={(event) =>
                setQuery((current) => ({ ...current, language: event.target.value, page: 1 }))
              }
            >
              <option value="">Any language</option>
              {meta.languages.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
          </label>

          <label className="field-block">
            <span>Minimum rating</span>
            <select
              value={query.minRating}
              onChange={(event) =>
                setQuery((current) => ({ ...current, minRating: event.target.value, page: 1 }))
              }
            >
              <option value="">Any rating</option>
              <option value="4">4.0+</option>
              <option value="4.5">4.5+</option>
              <option value="4.8">4.8+</option>
            </select>
          </label>

          <label className="field-block">
            <span>Maximum budget</span>
            <select
              value={query.maxPrice}
              onChange={(event) =>
                setQuery((current) => ({ ...current, maxPrice: event.target.value, page: 1 }))
              }
            >
              <option value="">No limit</option>
              <option value="2200">Rs. 2200</option>
              <option value="2600">Rs. 2600</option>
              <option value="3000">Rs. 3000</option>
            </select>
          </label>

          <label className="field-block">
            <span>Sort by</span>
            <select
              value={query.sortBy}
              onChange={(event) =>
                setQuery((current) => ({ ...current, sortBy: event.target.value, page: 1 }))
              }
            >
              <option value="top-rated">Top rated</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="experience">Experience</option>
              <option value="newest">Newest</option>
            </select>
          </label>
        </div>

        <label className="toggle-row">
          <input
            type="checkbox"
            checked={query.featured}
            onChange={(event) =>
              setQuery((current) => ({ ...current, featured: event.target.checked, page: 1 }))
            }
          />
          <span>Show featured experts only</span>
        </label>
      </section>

      {recentExperts.length ? (
        <section className="atlas-panel recent-panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Recently viewed</p>
              <h2>Jump back into your research queue</h2>
            </div>
          </div>
          <div className="recent-grid">
            {recentExperts.map((expert) => (
              <div key={expert._id} className="recent-card">
                <strong>{expert.name}</strong>
                <span>{expert.category}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {loading ? <Loader label="Loading expert graph..." /> : null}
      {!loading && error ? <ErrorState message={error} onAction={fetchExperts} /> : null}

      {!loading && !error ? (
        <>
          <section className="expert-grid">
            {experts.map((expert) => (
              <ExpertCard
                key={expert._id}
                expert={expert}
                isFavorite={favoriteIds.includes(expert._id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </section>

          {experts.length === 0 ? (
            <div className="state-card">
              <h3>No experts matched this filter graph.</h3>
              <p>Try widening the budget or removing one of the specialty filters.</p>
            </div>
          ) : null}

          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            onPageChange={(page) => setQuery((current) => ({ ...current, page }))}
          />
        </>
      ) : null}
    </div>
  );
}
