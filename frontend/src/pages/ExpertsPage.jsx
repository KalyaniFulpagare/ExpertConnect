import { useDeferredValue, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, getApiError } from "../api/client";
import { Loader } from "../components/Loader";
import { ErrorState } from "../components/ErrorState";
import { Pagination } from "../components/Pagination";

export function ExpertsPage() {
  const [experts, setExperts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, categories: [] });
  const [query, setQuery] = useState({ search: "", category: "", page: 1 });
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
            category: query.category
          }
        }),
        api.get("/bookings/overview/stats")
      ]);

      setExperts(expertsResponse.data.data);
      setMeta(expertsResponse.data.meta);
      setOverview(overviewResponse.data);
    } catch (requestError) {
      setError(getApiError(requestError, "We could not load the expert directory."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperts();
  }, [query.page, query.category, deferredSearch]);

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Ship-ready scheduling</p>
          <h1>Find the right expert and book a live session without collisions.</h1>
          <p className="hero-copy">
            Search, filter, and book in real time. If another user grabs a slot, the UI updates
            instantly.
          </p>
        </div>
        <div className="overview-grid">
          <article className="overview-card">
            <span>Total bookings</span>
            <strong>{overview?.totalBookings ?? 0}</strong>
          </article>
          <article className="overview-card">
            <span>Pending</span>
            <strong>
              {overview?.statusCounts?.find((item) => item._id === "Pending")?.count ?? 0}
            </strong>
          </article>
          <article className="overview-card">
            <span>Confirmed</span>
            <strong>
              {overview?.statusCounts?.find((item) => item._id === "Confirmed")?.count ?? 0}
            </strong>
          </article>
        </div>
      </section>

      <section className="toolbar card">
        <label className="field-block">
          <span>Search expert</span>
          <input
            type="search"
            value={query.search}
            onChange={(event) => setQuery((current) => ({ ...current, search: event.target.value, page: 1 }))}
            placeholder="Search by name"
          />
        </label>

        <label className="field-block">
          <span>Category</span>
          <select
            value={query.category}
            onChange={(event) => setQuery((current) => ({ ...current, category: event.target.value, page: 1 }))}
          >
            <option value="">All categories</option>
            {meta.categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="secondary-button"
          onClick={() => setQuery({ search: "", category: "", page: 1 })}
        >
          Reset filters
        </button>
      </section>

      {loading ? <Loader label="Loading experts..." /> : null}
      {!loading && error ? <ErrorState message={error} onAction={fetchExperts} /> : null}

      {!loading && !error ? (
        <>
          <section className="expert-grid">
            {experts.map((expert) => (
              <article key={expert._id} className="expert-card">
                <div className="expert-card-top">
                  <div>
                    <p className="category-chip">{expert.category}</p>
                    <h2>{expert.name}</h2>
                  </div>
                  <div className="rating-pill">{expert.rating.toFixed(1)} / 5</div>
                </div>
                <p className="expert-meta">{expert.experience}+ years experience</p>
                <p className="expert-copy">{expert.bio}</p>
                <div className="expert-footer">
                  <span>From Rs. {expert.pricePerSession}</span>
                  <Link className="primary-link" to={`/experts/${expert._id}`}>
                    View details
                  </Link>
                </div>
              </article>
            ))}
          </section>

          {experts.length === 0 ? (
            <div className="state-card">
              <h3>No experts matched this search.</h3>
              <p>Try a different name or remove the category filter.</p>
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
