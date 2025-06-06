import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface VehicleModel {
  id: string;
  name: string;
  segment_id: string;
}

interface ModelCode {
  id: string;
  code: string;
  year: number;
  model_id: string;
}

interface VehicleSegment {
  id: string;
  name: string;
  brand_id: string;
}

export function useVehicleData(brandName: string | null, year: number | null) {
  const [segments, setSegments] = useState<VehicleSegment[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [modelCodes, setModelCodes] = useState<ModelCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  // Set up isMounted ref
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchSegments = useCallback(async () => {
    if (!brandName) {
      setSegments([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const controller = new AbortController();
      const { data: brandData, error: brandError } = await supabase
        .from('vehicle_brands')
        .select('id')
        .eq('name', brandName)
        .single();

      if (brandError) throw brandError;

      const { data, error: segmentError } = await supabase
        .from('vehicle_segments')
        .select('id, name, brand_id')
        .eq('brand_id', brandData.id)
        .order('name');

      if (segmentError) throw segmentError;
      
      if (isMounted.current) {
        setSegments(data || []);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch segments');
        setSegments([]);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [brandName]);

  const fetchModels = useCallback(async (segmentId: string | null) => {
    if (!segmentId || !year) {
      setModels([]);
      setModelCodes([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const controller = new AbortController();
      // First get all models for the segment
      const { data: modelData, error: modelError } = await supabase
        .from('vehicle_models')
        .select('id, name, segment_id')
        .eq('segment_id', segmentId)
        .order('name');

      if (modelError) throw modelError;

      // Then get model codes for the selected year
      const { data: codeData, error: codeError } = await supabase
        .from('model_codes')
        .select('id, code, year, model_id')
        .eq('year', year);

      if (codeError) throw codeError;

      // Filter models to only those that have codes for the selected year
      const modelIdsWithCodes = new Set(codeData.map(code => code.model_id));
      const availableModels = modelData.filter(model => modelIdsWithCodes.has(model.id));

      if (isMounted.current) {
        setModels(availableModels || []);
        setModelCodes(codeData || []);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch models');
        setModels([]);
        setModelCodes([]);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [year]);

  // Fetch segments when brand changes
  useEffect(() => {
    fetchSegments();
  }, [fetchSegments]);

  return {
    segments,
    models,
    modelCodes,
    loading,
    error,
    fetchModels
  };
}