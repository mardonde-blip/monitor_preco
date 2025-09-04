'use client';

import { useState } from 'react';

interface FilterOptions {
  priceRange: { min: number; max: number };
  brands: string[];
  stores: string[];
  categories: string[];
  sortBy: 'price' | 'relevance' | 'discount';
  sortOrder: 'asc' | 'desc';
}

interface AdvancedFiltersProps {
  onFiltersChange: (filters: FilterOptions) => void;
  availableBrands?: string[];
  availableStores?: string[];
}

export default function AdvancedFilters({ 
  onFiltersChange, 
  availableBrands = [], 
  availableStores = [] 
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    priceRange: { min: 0, max: 10000 },
    brands: [],
    stores: [],
    categories: [],
    sortBy: 'relevance',
    sortOrder: 'desc'
  });

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const handleBrandToggle = (brand: string) => {
    const newBrands = filters.brands.includes(brand)
      ? filters.brands.filter(b => b !== brand)
      : [...filters.brands, brand];
    handleFilterChange({ brands: newBrands });
  };

  const handleStoreToggle = (store: string) => {
    const newStores = filters.stores.includes(store)
      ? filters.stores.filter(s => s !== store)
      : [...filters.stores, store];
    handleFilterChange({ stores: newStores });
  };

  // const handleCategoryToggle = (category: string) => {
  //   const newCategories = filters.categories.includes(category)
  //     ? filters.categories.filter(c => c !== category)
  //     : [...filters.categories, category];
  //   handleFilterChange({ categories: newCategories });
  // };

  const clearAllFilters = () => {
    const clearedFilters = {
      priceRange: { min: 0, max: 10000 },
      brands: [],
      stores: [],
      categories: [],
      sortBy: 'relevance' as const,
      sortOrder: 'desc' as const
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const activeFiltersCount = filters.brands.length + filters.stores.length + filters.categories.length;

  return (
    <div className="bg-white rounded-lg shadow-md mb-6">
      {/* Filter Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <span className="text-lg font-semibold text-gray-900">🔧 Filtros Avançados</span>
          {activeFiltersCount > 0 && (
            <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Filter Content */}
      {isOpen && (
        <div className="border-t border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Price Range */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">💰 Faixa de Preço</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Mínimo</label>
                  <input
                    type="number"
                    value={filters.priceRange.min}
                    onChange={(e) => handleFilterChange({
                      priceRange: { ...filters.priceRange, min: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="R$ 0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Máximo</label>
                  <input
                    type="number"
                    value={filters.priceRange.max}
                    onChange={(e) => handleFilterChange({
                      priceRange: { ...filters.priceRange, max: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="R$ 10.000"
                  />
                </div>
              </div>
            </div>

            {/* Brands */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">🏷️ Marcas</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availableBrands.length > 0 ? availableBrands.map((brand) => (
                  <label key={brand} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.brands.includes(brand)}
                      onChange={() => handleBrandToggle(brand)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{brand}</span>
                  </label>
                )) : (
                  <p className="text-sm text-gray-500">Nenhuma marca disponível</p>
                )}
              </div>
            </div>

            {/* Stores */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">🏪 Lojas</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availableStores.length > 0 ? availableStores.map((store) => (
                  <label key={store} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.stores.includes(store)}
                      onChange={() => handleStoreToggle(store)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{store}</span>
                  </label>
                )) : (
                  <p className="text-sm text-gray-500">Nenhuma loja disponível</p>
                )}
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">📊 Ordenar por</h4>
              <div className="space-y-3">
                <div>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange({ sortBy: e.target.value as 'price' | 'relevance' | 'discount' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="relevance">Relevância</option>
                    <option value="price">Preço</option>
                    <option value="discount">Desconto</option>
                  </select>
                </div>
                <div>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) => handleFilterChange({ sortOrder: e.target.value as 'asc' | 'desc' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="desc">Maior para Menor</option>
                    <option value="asc">Menor para Maior</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              🗑️ Limpar Filtros
            </button>
            <div className="text-sm text-gray-500">
              {activeFiltersCount > 0 && `${activeFiltersCount} filtro(s) ativo(s)`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}