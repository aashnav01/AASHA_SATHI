import { Router, Request, Response } from 'express';
import facilities from '../data/facilities.json';
import { Referral } from '../models/Referral';
import { TEST_ASHA_ID } from './asha';

const router = Router();

/**
 * POST /api/referral/log
 * Log a referral event when ASHA escorts pregnant woman to health facility
 * Persists to MongoDB with clientId-based deduplication for offline sync
 */
router.post('/log', async (req: Request, res: Response) => {
  try {
    const {
      patient_name,
      facility_id,
      status, // 'pending' | 'transported'
      checklist, // { ifa_tablets: bool, anc_card: bool, aadhaar: bool, cash: bool }
      clientId,
      clientTimestamp,
    } = req.body;

    if (!patient_name || !facility_id) {
      return res.status(400).json({
        error: 'Missing required fields: patient_name, facility_id'
      });
    }

    const referral = await Referral.create({
      asha_id: TEST_ASHA_ID,
      patient_name,
      facility_id,
      status: status || 'pending',
      checklist: checklist || { ifa_tablets: false, anc_card: false, aadhaar: false, cash: false },
      clientId,
      timestamp: clientTimestamp ? new Date(clientTimestamp) : new Date(),
    });

    return res.status(201).json({
      success: true,
      message: 'Referral logged and persisted',
      data: {
        id: referral._id,
        asha_id: referral.asha_id,
        patient_name: referral.patient_name,
        facility_id: referral.facility_id,
        status: referral.status,
        timestamp: referral.timestamp,
      }
    });
  } catch (error: any) {
    // Handle duplicate clientId (offline sync retry)
    if (error.code === 11000 && error.keyPattern?.clientId) {
      return res.status(409).json({
        success: false,
        error: 'Duplicate entry (already synced)',
        isDuplicate: true
      });
    }
    console.error('Error logging referral:', error);
    return res.status(500).json({
      error: 'Failed to log referral',
      details: error.message
    });
  }
});

/**
 * GET /api/referral/facilities
 * Get facility list, optionally filtered by state or geo-proximity
 * Used by ReferralMode tab for facility lookup
 */
router.get('/facilities', async (req: Request, res: Response) => {
  try {
    const { state, type, latitude, longitude, radius_km = 10 } = req.query;

    let filtered = [...facilities.facilities];

    // Filter by state if provided
    if (state) {
      filtered = filtered.filter(f => f.state.toLowerCase() === (state as string).toLowerCase());
    }

    // Filter by facility type (PHC or FRU)
    if (type) {
      filtered = filtered.filter(f => f.type === type);
    }

    // Filter by geo-proximity if coordinates provided
    if (latitude && longitude) {
      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      const radiusKm = parseFloat(radius_km as string);

      filtered = filtered.filter(f => {
        // Simple Haversine distance calculation
        const R = 6371; // Earth radius in km
        const dLat = (f.latitude - lat) * Math.PI / 180;
        const dLng = (f.longitude - lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat * Math.PI / 180) * Math.cos(f.latitude * Math.PI / 180) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return distance <= radiusKm;
      });
    }

    // Sort by type (FRU first, then PHC) and name
    filtered.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'FRU' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return res.json({
      success: true,
      count: filtered.length,
      facilities: filtered.map(f => ({
        id: f.id,
        name: f.name,
        type: f.type,
        state: f.state,
        district: f.district,
        phone: f.phone,
        address: f.address,
        latitude: f.latitude,
        longitude: f.longitude,
      }))
    });
  } catch (error: any) {
    console.error('Error fetching facilities:', error);
    return res.status(500).json({
      error: 'Failed to fetch facilities',
      details: error.message
    });
  }
});

/**
 * GET /api/referral/facility/:id
 * Get details of a specific facility
 */
router.get('/facility/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const facility = facilities.facilities.find(f => f.id === id);

    if (!facility) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    return res.json({
      success: true,
      facility: {
        id: facility.id,
        name: facility.name,
        type: facility.type,
        state: facility.state,
        district: facility.district,
        phone: facility.phone,
        address: facility.address,
        latitude: facility.latitude,
        longitude: facility.longitude,
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to fetch facility',
      details: error.message
    });
  }
});

/**
 * GET /api/referral/emergency
 * Get emergency contact info (108 ambulance, etc.)
 */
router.get('/emergency', async (req: Request, res: Response) => {
  try {
    const emergency = facilities.emergency_services;
    return res.json({
      success: true,
      emergency: {
        ambulance_number: emergency.ambulance_108,
        ambulance_name: emergency.ambulance_name,
        available: emergency.ambulance_available,
        jssk_coverage: emergency.jssk_coverage,
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to fetch emergency info',
      details: error.message
    });
  }
});

export default router;
