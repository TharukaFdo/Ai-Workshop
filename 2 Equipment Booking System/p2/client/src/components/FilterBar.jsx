import React from 'react';

function FilterBar({
  filters,
  setFilters,
  equipmentList,
  handleClearFilters
}) {
  return (
    <section className="filter-bar">
      <div className="filter-group">
        <label htmlFor="filter-equipment">Filter by Equipment</label>
        <select
          id="filter-equipment"
          value={filters.equipmentName}
          onChange={(e) => setFilters({ ...filters, equipmentName: e.target.value })}
        >
          <option value="">All Equipment</option>
          {equipmentList.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="filter-date">Filter by Date</label>
        <input
          type="date"
          id="filter-date"
          value={filters.bookingDate}
          onChange={(e) => setFilters({ ...filters, bookingDate: e.target.value })}
        />
      </div>

      <div className="filter-group">
        <label htmlFor="filter-status">Filter by Status</label>
        <select
          id="filter-status"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Collected">Collected</option>
          <option value="Returned">Returned</option>
        </select>
      </div>

      <div>
        <button className="btn btn-secondary" onClick={handleClearFilters}>
          Clear Filters
        </button>
      </div>
    </section>
  );
}

export default FilterBar;
