
import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const SearchBar = () => {
    const {
        search,
        setSearch,
        showSearch,
        setShowSearch,
        backendUrl,
        setAiProducts,
        setAiSearchActive,
        aiSearchLoading,
        setAiSearchLoading
    } = useContext(ShopContext);

    const [visible, setVisible] = useState(false);
    const location = useLocation();

    useEffect(() => {
        setVisible(location.pathname.includes('collection'));
    }, [location]);

    const handleSearch = async (e) => {
        e.preventDefault();

        if (!search.trim()) {
            setAiSearchActive(false);
            setAiProducts([]);
            return;
        }

        try {
            setAiSearchLoading(true);

            const response = await axios.post(
                backendUrl + '/api/ai/test',
                { query: search.trim() }
            );

            if (response.data.success) {
                setAiProducts(response.data.products || []);
                setAiSearchActive(true);
                setShowSearch(true);
            } else {
                toast.error(response.data.message || 'AI search failed');
            }
        } catch (error) {
            console.error('AI search error:', error);
            toast.error(
                error.response?.data?.message || 'Unable to search products'
            );
        } finally {
            setAiSearchLoading(false);
        }
    };

    return showSearch && visible ? (
        <div className="border-t border-b bg-gray-50 text-center">
            <form
                onSubmit={handleSearch}
                className="inline-flex items-center justify-center border border-gray-400 px-4 py-2 my-5 mx-3 rounded-full w-3/4 sm:w-3/5 gap-2"
            >
                <input
                    type="text"
                    placeholder="Try: women cotton top under $100"
                    className="flex-1 outline-none bg-inherit text-sm min-w-0"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <button
                    type="submit"
                    disabled={aiSearchLoading}
                    className="text-sm px-3 py-1 rounded-full bg-black text-white disabled:opacity-50"
                >
                    {aiSearchLoading ? 'Searching...' : 'Search'}
                </button>

                <img
                    src={assets.search_icon}
                    alt="Search"
                    className="w-4"
                />
            </form>

            <button
                type="button"
                onClick={() => setShowSearch(false)}
                className="inline-block text-sm cursor-pointer"
                aria-label="Close search"
            >
                ✕
            </button>
        </div>
    ) : null;
};

export default SearchBar;
