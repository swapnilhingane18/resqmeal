import { useState, useEffect } from 'react';

export const useFetch = (apiFunction, params = null, dependencies = []) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = params ? await apiFunction(params) : await apiFunction();
            setData(result);
        } catch (err) {
            setError(err.error || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, dependencies);

    return { data, loading, error, refetch: fetchData };
};
