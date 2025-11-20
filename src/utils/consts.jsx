export const API_ENDPOINT_URL = process.env.REACT_APP_API_ENDPOINT_URL || 'http://localhost:8000/api/dark/';
export const USERSITE_URL = process.env.REACT_APP_USERSITE_URL || 'http://localhost:3000/';

export const PRIMARY = '#b51515';

export const ORGANIZER_ALLOWED_ROLES = [
    'POS',
    'Agent',
    'Scanner',
    'Shop Keeper',
    'Box Office Manager',
    'Sponsor',
    'Accreditation'
];


export const DUMMY_DATA = {
  "success": true,
  "data": {
    "id": "layout_1234567890",
    "name": "Grand Auditorium - Main Hall",
    "createdAt": "2024-11-19T10:00:00.000Z",
    "updatedAt": "2024-11-19T12:00:00.000Z",
    "stage": {
      "position": "top",
      "shape": "straight",
      "width": 800,
      "height": 50,
      "x": 100,
      "y": 50,
      "name": "SCREEN"
    },
    "sections": [
      {
        "id": "section_1",
        "name": "VIP Section",
        "type": "VIP",
        "x": 100,
        "y": 150,
        "width": 800,
        "height": 200,
        "rows": [
          {
            "id": "row_1",
            "title": "A",
            "numberOfSeats": 12,
            "ticketCategory": "cat_3",
            "shape": "straight",
            "curve": 0,
            "spacing": 40,
            "seats": [
              {
                "id": "seat_1_1",
                "number": 1,
                "label": "A1",
                "x": 100,
                "y": 50,
                "ticketCategory": "cat_3",
                "status": "available",
                "radius": 12
              },
              {
                "id": "seat_1_2",
                "number": 2,
                "label": "A2",
                "x": 160,
                "y": 50,
                "ticketCategory": "cat_3",
                "status": "available",
                "radius": 12
              },
              {
                "id": "seat_1_3",
                "number": 3,
                "label": "A3",
                "x": 220,
                "y": 50,
                "ticketCategory": "cat_3",
                "status": "reserved",
                "radius": 12
              },
              {
                "id": "seat_1_4",
                "number": 4,
                "label": "A4",
                "x": 280,
                "y": 50,
                "ticketCategory": "cat_3",
                "status": "reserved",
                "radius": 12
              },
              {
                "id": "seat_1_5",
                "number": 5,
                "label": "A5",
                "x": 340,
                "y": 50,
                "ticketCategory": "cat_3",
                "status": "available",
                "radius": 12
              },
              {
                "id": "seat_1_6",
                "number": 6,
                "label": "A6",
                "x": 400,
                "y": 50,
                "ticketCategory": "cat_3",
                "status": "available",
                "radius": 12
              },
              {
                "id": "seat_1_7",
                "number": 7,
                "label": "A7",
                "x": 460,
                "y": 50,
                "ticketCategory": "cat_3",
                "status": "available",
                "radius": 12
              },
              {
                "id": "seat_1_8",
                "number": 8,
                "label": "A8",
                "x": 520,
                "y": 50,
                "ticketCategory": "cat_3",
                "status": "available",
                "radius": 12
              },
              {
                "id": "seat_1_9",
                "number": 9,
                "label": "A9",
                "x": 580,
                "y": 50,
                "ticketCategory": "cat_3",
                "status": "blocked",
                "radius": 12
              },
              {
                "id": "seat_1_10",
                "number": 10,
                "label": "A10",
                "x": 640,
                "y": 50,
                "ticketCategory": "cat_3",
                "status": "available",
                "radius": 12
              },
              {
                "id": "seat_1_11",
                "number": 11,
                "label": "A11",
                "x": 700,
                "y": 50,
                "ticketCategory": "cat_3",
                "status": "available",
                "radius": 12
              },
              {
                "id": "seat_1_12",
                "number": 12,
                "label": "A12",
                "x": 760,
                "y": 50,
                "ticketCategory": "cat_3",
                "status": "available",
                "radius": 12
              }
            ]
          },
          {
            "id": "row_2",
            "title": "B",
            "numberOfSeats": 12,
            "ticketCategory": "cat_3",
            "shape": "straight",
            "curve": 0,
            "spacing": 40,
            "seats": [
              {
                "id": "seat_2_1",
                "number": 1,
                "label": "B1",
                "x": 100,
                "y": 90,
                "ticketCategory": "cat_3",
                "status": "available",
                "radius": 12
              },
              {
                "id": "seat_2_2",
                "number": 2,
                "label": "B2",
                "x": 160,
                "y": 90,
                "ticketCategory": "cat_3",
                "status": "available",
                "radius": 12
              },
              {
                "id": "seat_2_3",
                "number": 3,
                "label": "B3",
                "x": 220,
                "y": 90,
                "ticketCategory": "cat_3",
                "status": "available",
                "radius": 12
              },
              {
                "id": "seat_2_4",
                "number": 4,
                "label": "B4",
                "x": 280,
                "y": 90,
                "ticketCategory": "cat_3",
                "status": "available",
                "radius": 12
              },
              {
                "id": "seat_2_5",
                "number": 5,
                "label": "B5",
                "x": 340,
                "y": 90,
                "ticketCategory": "cat_3",
                "status": "available",
                "radius": 12
              },
              {
                "id": "seat_2_6",
                "number": 6,
                "label": "B6",
                "x": 400,
                "y": 90,
                "ticketCategory": "cat_3",
                "status": "available",
                "radius": 12
              },
              {
                "id": "seat_2_7",
                "number": 7,
                "label": "B7",
                "x": 460,
                "y": 90,
                "ticketCategory": "cat_3",
                "status": "available",
                "radius": 12
              },
              {
                "id": "seat_2_8",
                "number": 8,
                "label": "B8",
                "x": 520,
                "y": 90,
                "ticketCategory": "cat_3",
                "status": "available",
                "radius": 12
              },
              {
                "id": "seat_2_9",
                "number": 9,
                "label": "B9",
                "x": 580,
                "y": 90,
                "ticketCategory": "cat_3",
                "status": "available",
                "radius": 12
              },
              {
                "id": "seat_2_10",
                "number": 10,
                "label": "B10",
                "x": 640,
                "y": 90,
                "ticketCategory": "cat_3",
                "status": "available",
                "radius": 12
              },
              {
                "id": "seat_2_11",
                "number": 11,
                "label": "B11",
                "x": 700,
                "y": 90,
                "ticketCategory": "cat_3",
                "status": "available",
                "radius": 12
              },
              {
                "id": "seat_2_12",
                "number": 12,
                "label": "B12",
                "x": 760,
                "y": 90,
                "ticketCategory": "cat_3",
                "status": "available",
                "radius": 12
              }
            ]
          }
        ],
        "subSections": []
      },
      {
        "id": "section_2",
        "name": "Premium Section",
        "type": "Regular",
        "x": 100,
        "y": 380,
        "width": 800,
        "height": 300,
        "rows": [
          {
            "id": "row_3",
            "title": "C",
            "numberOfSeats": 15,
            "ticketCategory": "cat_2",
            "shape": "straight",
            "curve": 0,
            "spacing": 40,
            "seats": [
              {
                "id": "seat_3_1",
                "number": 1,
                "label": "C1",
                "x": 80,
                "y": 50,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_3_2",
                "number": 2,
                "label": "C2",
                "x": 133,
                "y": 50,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_3_3",
                "number": 3,
                "label": "C3",
                "x": 186,
                "y": 50,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_3_4",
                "number": 4,
                "label": "C4",
                "x": 239,
                "y": 50,
                "ticketCategory": "cat_2",
                "status": "reserved",
                "radius": 11
              },
              {
                "id": "seat_3_5",
                "number": 5,
                "label": "C5",
                "x": 292,
                "y": 50,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_3_6",
                "number": 6,
                "label": "C6",
                "x": 345,
                "y": 50,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_3_7",
                "number": 7,
                "label": "C7",
                "x": 398,
                "y": 50,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_3_8",
                "number": 8,
                "label": "C8",
                "x": 451,
                "y": 50,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_3_9",
                "number": 9,
                "label": "C9",
                "x": 504,
                "y": 50,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_3_10",
                "number": 10,
                "label": "C10",
                "x": 557,
                "y": 50,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_3_11",
                "number": 11,
                "label": "C11",
                "x": 610,
                "y": 50,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_3_12",
                "number": 12,
                "label": "C12",
                "x": 663,
                "y": 50,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_3_13",
                "number": 13,
                "label": "C13",
                "x": 716,
                "y": 50,
                "ticketCategory": "cat_2",
                "status": "disabled",
                "radius": 11
              },
              {
                "id": "seat_3_14",
                "number": 14,
                "label": "C14",
                "x": 769,
                "y": 50,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_3_15",
                "number": 15,
                "label": "C15",
                "x": 822,
                "y": 50,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              }
            ]
          },
          {
            "id": "row_4",
            "title": "D",
            "numberOfSeats": 15,
            "ticketCategory": "cat_2",
            "shape": "straight",
            "curve": 0,
            "spacing": 40,
            "seats": [
              {
                "id": "seat_4_1",
                "number": 1,
                "label": "D1",
                "x": 80,
                "y": 90,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_4_2",
                "number": 2,
                "label": "D2",
                "x": 133,
                "y": 90,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_4_3",
                "number": 3,
                "label": "D3",
                "x": 186,
                "y": 90,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_4_4",
                "number": 4,
                "label": "D4",
                "x": 239,
                "y": 90,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_4_5",
                "number": 5,
                "label": "D5",
                "x": 292,
                "y": 90,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_4_6",
                "number": 6,
                "label": "D6",
                "x": 345,
                "y": 90,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_4_7",
                "number": 7,
                "label": "D7",
                "x": 398,
                "y": 90,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_4_8",
                "number": 8,
                "label": "D8",
                "x": 451,
                "y": 90,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_4_9",
                "number": 9,
                "label": "D9",
                "x": 504,
                "y": 90,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_4_10",
                "number": 10,
                "label": "D10",
                "x": 557,
                "y": 90,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_4_11",
                "number": 11,
                "label": "D11",
                "x": 610,
                "y": 90,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_4_12",
                "number": 12,
                "label": "D12",
                "x": 663,
                "y": 90,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_4_13",
                "number": 13,
                "label": "D13",
                "x": 716,
                "y": 90,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_4_14",
                "number": 14,
                "label": "D14",
                "x": 769,
                "y": 90,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_4_15",
                "number": 15,
                "label": "D15",
                "x": 822,
                "y": 90,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              }
            ]
          },
          {
            "id": "row_5",
            "title": "E",
            "numberOfSeats": 15,
            "ticketCategory": "cat_2",
            "shape": "straight",
            "curve": 0,
            "spacing": 40,
            "seats": [
              {
                "id": "seat_5_1",
                "number": 1,
                "label": "E1",
                "x": 80,
                "y": 130,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_5_2",
                "number": 2,
                "label": "E2",
                "x": 133,
                "y": 130,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_5_3",
                "number": 3,
                "label": "E3",
                "x": 186,
                "y": 130,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_5_4",
                "number": 4,
                "label": "E4",
                "x": 239,
                "y": 130,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_5_5",
                "number": 5,
                "label": "E5",
                "x": 292,
                "y": 130,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_5_6",
                "number": 6,
                "label": "E6",
                "x": 345,
                "y": 130,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_5_7",
                "number": 7,
                "label": "E7",
                "x": 398,
                "y": 130,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_5_8",
                "number": 8,
                "label": "E8",
                "x": 451,
                "y": 130,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_5_9",
                "number": 9,
                "label": "E9",
                "x": 504,
                "y": 130,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_5_10",
                "number": 10,
                "label": "E10",
                "x": 557,
                "y": 130,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_5_11",
                "number": 11,
                "label": "E11",
                "x": 610,
                "y": 130,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_5_12",
                "number": 12,
                "label": "E12",
                "x": 663,
                "y": 130,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_5_13",
                "number": 13,
                "label": "E13",
                "x": 716,
                "y": 130,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_5_14",
                "number": 14,
                "label": "E14",
                "x": 769,
                "y": 130,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              },
              {
                "id": "seat_5_15",
                "number": 15,
                "label": "E15",
                "x": 822,
                "y": 130,
                "ticketCategory": "cat_2",
                "status": "available",
                "radius": 11
              }
            ]
          }
        ],
        "subSections": []
      },
      {
        "id": "section_3",
        "name": "Regular Section",
        "type": "Regular",
        "x": 100,
        "y": 710,
        "width": 800,
        "height": 350,
        "rows": [
          {
            "id": "row_6",
            "title": "F",
            "numberOfSeats": 18,
            "ticketCategory": "cat_1",
            "shape": "straight",
            "curve": 0,
            "spacing": 40,
            "seats": [
              {
                "id": "seat_6_1",
                "number": 1,
                "label": "F1",
                "x": 67,
                "y": 50,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_6_2",
                "number": 2,
                "label": "F2",
                "x": 111,
                "y": 50,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_6_3",
                "number": 3,
                "label": "F3",
                "x": 155,
                "y": 50,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_6_4",
                "number": 4,
                "label": "F4",
                "x": 199,
                "y": 50,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_6_5",
                "number": 5,
                "label": "F5",
                "x": 243,
                "y": 50,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_6_6",
                "number": 6,
                "label": "F6",
                "x": 287,
                "y": 50,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_6_7",
                "number": 7,
                "label": "F7",
                "x": 331,
                "y": 50,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_6_8",
                "number": 8,
                "label": "F8",
                "x": 375,
                "y": 50,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_6_9",
                "number": 9,
                "label": "F9",
                "x": 419,
                "y": 50,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_6_10",
                "number": 10,
                "label": "F10",
                "x": 463,
                "y": 50,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_6_11",
                "number": 11,
                "label": "F11",
                "x": 507,
                "y": 50,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_6_12",
                "number": 12,
                "label": "F12",
                "x": 551,
                "y": 50,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_6_13",
                "number": 13,
                "label": "F13",
                "x": 595,
                "y": 50,
                "ticketCategory": "cat_1",
                "status": "reserved",
                "radius": 10
              },
              {
                "id": "seat_6_14",
                "number": 14,
                "label": "F14",
                "x": 639,
                "y": 50,
                "ticketCategory": "cat_1",
                "status": "reserved",
                "radius": 10
              },
              {
                "id": "seat_6_15",
                "number": 15,
                "label": "F15",
                "x": 683,
                "y": 50,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_6_16",
                "number": 16,
                "label": "F16",
                "x": 727,
                "y": 50,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_6_17",
                "number": 17,
                "label": "F17",
                "x": 771,
                "y": 50,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_6_18",
                "number": 18,
                "label": "F18",
                "x": 815,
                "y": 50,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              }
            ]
          },
          {
            "id": "row_7",
            "title": "G",
            "numberOfSeats": 18,
            "ticketCategory": "cat_1",
            "shape": "straight",
            "curve": 0,
            "spacing": 40,
            "seats": [
              {
                "id": "seat_7_1",
                "number": 1,
                "label": "G1",
                "x": 67,
                "y": 90,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_7_2",
                "number": 2,
                "label": "G2",
                "x": 111,
                "y": 90,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_7_3",
                "number": 3,
                "label": "G3",
                "x": 155,
                "y": 90,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_7_4",
                "number": 4,
                "label": "G4",
                "x": 199,
                "y": 90,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_7_5",
                "number": 5,
                "label": "G5",
                "x": 243,
                "y": 90,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_7_6",
                "number": 6,
                "label": "G6",
                "x": 287,
                "y": 90,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_7_7",
                "number": 7,
                "label": "G7",
                "x": 331,
                "y": 90,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_7_8",
                "number": 8,
                "label": "G8",
                "x": 375,
                "y": 90,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_7_9",
                "number": 9,
                "label": "G9",
                "x": 419,
                "y": 90,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_7_10",
                "number": 10,
                "label": "G10",
                "x": 463,
                "y": 90,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_7_11",
                "number": 11,
                "label": "G11",
                "x": 507,
                "y": 90,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_7_12",
                "number": 12,
                "label": "G12",
                "x": 551,
                "y": 90,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_7_13",
                "number": 13,
                "label": "G13",
                "x": 595,
                "y": 90,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_7_14",
                "number": 14,
                "label": "G14",
                "x": 639,
                "y": 90,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_7_15",
                "number": 15,
                "label": "G15",
                "x": 683,
                "y": 90,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_7_16",
                "number": 16,
                "label": "G16",
                "x": 727,
                "y": 90,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_7_17",
                "number": 17,
                "label": "G17",
                "x": 771,
                "y": 90,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_7_18",
                "number": 18,
                "label": "G18",
                "x": 815,
                "y": 90,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              }
            ]
          },
          {
            "id": "row_8",
            "title": "H",
            "numberOfSeats": 18,
            "ticketCategory": "cat_1",
            "shape": "straight",
            "curve": 0,
            "spacing": 40,
            "seats": [
              {
                "id": "seat_8_1",
                "number": 1,
                "label": "H1",
                "x": 67,
                "y": 130,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_8_2",
                "number": 2,
                "label": "H2",
                "x": 111,
                "y": 130,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_8_3",
                "number": 3,
                "label": "H3",
                "x": 155,
                "y": 130,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_8_4",
                "number": 4,
                "label": "H4",
                "x": 199,
                "y": 130,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_8_5",
                "number": 5,
                "label": "H5",
                "x": 243,
                "y": 130,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_8_6",
                "number": 6,
                "label": "H6",
                "x": 287,
                "y": 130,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_8_7",
                "number": 7,
                "label": "H7",
                "x": 331,
                "y": 130,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_8_8",
                "number": 8,
                "label": "H8",
                "x": 375,
                "y": 130,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_8_9",
                "number": 9,
                "label": "H9",
                "x": 419,
                "y": 130,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_8_10",
                "number": 10,
                "label": "H10",
                "x": 463,
                "y": 130,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_8_11",
                "number": 11,
                "label": "H11",
                "x": 507,
                "y": 130,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_8_12",
                "number": 12,
                "label": "H12",
                "x": 551,
                "y": 130,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_8_13",
                "number": 13,
                "label": "H13",
                "x": 595,
                "y": 130,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_8_14",
                "number": 14,
                "label": "H14",
                "x": 639,
                "y": 130,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_8_15",
                "number": 15,
                "label": "H15",
                "x": 683,
                "y": 130,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_8_16",
                "number": 16,
                "label": "H16",
                "x": 727,
                "y": 130,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_8_17",
                "number": 17,
                "label": "H17",
                "x": 771,
                "y": 130,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              },
              {
                "id": "seat_8_18",
                "number": 18,
                "label": "H18",
                "x": 815,
                "y": 130,
                "ticketCategory": "cat_1",
                "status": "available",
                "radius": 10
              }
            ]
          }
        ],
        "subSections": []
      }
    ],
    "ticketCategories": [
      {
        "id": "cat_1",
        "name": "Regular",
        "price": 200,
        "color": "#4CAF50"
      },
      {
        "id": "cat_2",
        "name": "Premium",
        "price": 350,
        "color": "#2196F3"
      },
      {
        "id": "cat_3",
        "name": "VIP",
        "price": 500,
        "color": "#FFD700"
      }
    ],
    "metadata": {
      "createdAt": "2024-11-19T10:00:00.000Z",
      "updatedAt": "2024-11-19T12:00:00.000Z",
      "totalSections": 3,
      "totalSeats": 129,
      "totalRows": 8
    }
  }
}
