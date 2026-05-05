#!/usr/bin/env node
// scripts/update-colors.mjs
// Writes colors/palette.json for every university with accurate brand colours,
// sorted by weight (1 = most prominent).

import { writeFile, readdir, mkdir, access } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UNI_DIR = join(__dirname, '..', 'public', 'universities');

// Format: hex, name, role (main|secondary|accent|neutral|light|dark), weight 1–5
const PALETTES = {
    'University of Aberdeen': [['#1e3a5f', 'Aberdeen Blue', 'main', 1], ['#c8b400', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3], ['#0d1f34', 'Dark Navy', 'dark', 4]],
    'Abertay University': [['#d4003b', 'Abertay Red', 'main', 1], ['#1a1a1a', 'Black', 'dark', 2], ['#ffffff', 'White', 'light', 3]],
    'Aberystwyth University': [['#007a3d', 'Aber Green', 'main', 1], ['#1c3c6e', 'Navy', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'Anglia Ruskin University': [['#4a1259', 'ARU Purple', 'main', 1], ['#f5a623', 'Amber', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'Arts University Bournemouth': [['#000000', 'Black', 'main', 1], ['#e8001d', 'AUB Red', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'Arts University Plymouth': [['#0057a8', 'Plymouth Blue', 'main', 1], ['#ffffff', 'White', 'light', 2], ['#1a1a1a', 'Dark', 'dark', 3]],
    'Aston University': [['#c8102e', 'Aston Red', 'main', 1], ['#1d2a57', 'Navy', 'secondary', 2], ['#f5c400', 'Gold', 'accent', 3], ['#ffffff', 'White', 'light', 4]],
    'Bangor University': [['#002060', 'Bangor Navy', 'main', 1], ['#c8922a', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Bath': [['#00307a', 'Bath Blue', 'main', 1], ['#d4a200', 'Bath Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'Bath Spa University': [['#e4002b', 'Bath Spa Red', 'main', 1], ['#1a1a1a', 'Black', 'dark', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Bedfordshire': [['#0088a9', 'Beds Teal', 'main', 1], ['#f5a623', 'Orange', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'Birkbeck University of London': [['#c8172b', 'Birkbeck Red', 'main', 1], ['#1c1c1c', 'Black', 'dark', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Birmingham': [['#002147', 'Birmingham Navy', 'main', 1], ['#b5a165', 'Birmingham Gold', 'secondary', 2], ['#9c1a00', 'Red', 'accent', 3], ['#ffffff', 'White', 'light', 4]],
    'Birmingham City University': [['#7a1985', 'BCU Purple', 'main', 1], ['#ffffff', 'White', 'light', 2], ['#1a1a1a', 'Black', 'dark', 3]],
    'Bishop Grosseteste University': [['#003865', 'BGU Navy', 'main', 1], ['#c8a200', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Bolton': [['#003366', 'Bolton Blue', 'main', 1], ['#e30613', 'Red', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'Bournemouth University': [['#7D2060', 'BU Magenta', 'main', 1], ['#ffffff', 'White', 'light', 2], ['#1a1a1a', 'Dark', 'dark', 3], ['#d4a0c8', 'Light Magenta', 'accent', 4]],
    'BPP University': [['#0076a3', 'BPP Blue', 'main', 1], ['#f5a623', 'Orange', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Bradford': [['#d4002a', 'Bradford Red', 'main', 1], ['#1d1d1b', 'Black', 'dark', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Brighton': [['#00308f', 'Brighton Blue', 'main', 1], ['#009c8f', 'Teal', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Bristol': [['#cf1f32', 'Bristol Red', 'main', 1], ['#1d1d1b', 'Black', 'dark', 2], ['#ffffff', 'White', 'light', 3]],
    'Brunel University London': [['#003d6b', 'Brunel Blue', 'main', 1], ['#c8a327', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Buckingham': [['#003f7f', 'Buckingham Blue', 'main', 1], ['#c8a84b', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'Buckinghamshire New University': [['#005eb8', 'Bucks Blue', 'main', 1], ['#e4007c', 'Pink', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Cambridge': [['#003264', 'Cambridge Blue', 'main', 1], ['#6ebfca', 'Light Blue', 'secondary', 2], ['#a3c1ad', 'Pale Teal', 'accent', 3], ['#ffffff', 'White', 'light', 4]],
    'Canterbury Christ Church University': [['#002147', 'CCCU Navy', 'main', 1], ['#c8a000', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'Cardiff University': [['#d4002a', 'Cardiff Red', 'main', 1], ['#1c1c1c', 'Black', 'dark', 2], ['#ffffff', 'White', 'light', 3]],
    'Cardiff Metropolitan University': [['#006272', 'Cardiff Met Teal', 'main', 1], ['#f5a800', 'Amber', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Central Lancashire': [['#003262', 'UCLan Navy', 'main', 1], ['#e4002b', 'Red', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Chester': [['#002147', 'Chester Navy', 'main', 1], ['#bf8f00', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Chichester': [['#004b87', 'Chichester Blue', 'main', 1], ['#e4002b', 'Red', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'City University of London': [['#d4002a', 'City Red', 'main', 1], ['#1d1d1b', 'Black', 'dark', 2], ['#ffffff', 'White', 'light', 3]],
    'Courtauld Institute of Art': [['#1c1c1c', 'Black', 'main', 1], ['#c8a800', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'Coventry University': [['#003366', 'Coventry Blue', 'main', 1], ['#e4007c', 'Pink', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'Cranfield University': [['#003b5c', 'Cranfield Blue', 'main', 1], ['#009fd4', 'Light Blue', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University for the Creative Arts': [['#1a1a1a', 'Black', 'main', 1], ['#d4002a', 'Red', 'secondary', 2], ['#f5f5f5', 'Light Grey', 'accent', 3]],
    'University of Cumbria': [['#003865', 'Cumbria Blue', 'main', 1], ['#009c8f', 'Teal', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'De Montfort University': [['#007a6c', 'DMU Teal', 'main', 1], ['#d4002a', 'Red', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Derby': [['#640032', 'Derby Burgundy', 'main', 1], ['#009c8f', 'Teal', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Dundee': [['#001e62', 'Dundee Navy', 'main', 1], ['#bb9900', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'Durham University': [['#7D2247', 'Durham Maroon', 'main', 1], ['#c8a000', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3], ['#000000', 'Black', 'dark', 4]],
    'University of East Anglia': [['#005b8e', 'UEA Blue', 'main', 1], ['#a18c5a', 'Bronze', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of East London': [['#d4002a', 'UEL Red', 'main', 1], ['#1d1d1b', 'Black', 'dark', 2], ['#ffffff', 'White', 'light', 3]],
    'Edge Hill University': [['#d30d4c', 'Edge Hill Pink', 'main', 1], ['#1a1a1a', 'Black', 'dark', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Edinburgh': [['#001e62', 'Edinburgh Navy', 'main', 1], ['#c8a000', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'Edinburgh Napier University': [['#6a1a53', 'Napier Purple', 'main', 1], ['#00b4a0', 'Teal', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Essex': [['#003e74', 'Essex Blue', 'main', 1], ['#f5a623', 'Amber', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Exeter': [['#003c57', 'Exeter Dark Blue', 'main', 1], ['#009faf', 'Teal', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'Falmouth University': [['#004a51', 'Falmouth Dark Teal', 'main', 1], ['#d4002a', 'Red', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Glasgow': [['#003865', 'Glasgow Navy', 'main', 1], ['#c8a327', 'Glasgow Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'Glasgow Caledonian University': [['#003965', 'GCU Blue', 'main', 1], ['#e4002b', 'Red', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Gloucestershire': [['#005eb8', 'Glos Blue', 'main', 1], ['#00a651', 'Green', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'Goldsmiths University of London': [['#003865', 'Goldsmiths Navy', 'main', 1], ['#d4002a', 'Red', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Greenwich': [['#06174a', 'Greenwich Navy', 'main', 1], ['#009faf', 'Teal', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'Harper Adams University': [['#006633', 'Harper Green', 'main', 1], ['#c8a000', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'Hartpury University': [['#004b29', 'Hartpury Dark Green', 'main', 1], ['#a8c800', 'Lime', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'Heriot-Watt University': [['#002147', 'HW Navy', 'main', 1], ['#0082b4', 'HW Blue', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Hertfordshire': [['#c8102e', 'Herts Red', 'main', 1], ['#231f20', 'Black', 'dark', 2], ['#ffffff', 'White', 'light', 3]],
    'University of the Highlands and Islands': [['#003865', 'UHI Blue', 'main', 1], ['#c8a000', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Huddersfield': [['#c8102e', 'Huddersfield Red', 'main', 1], ['#1d1d1b', 'Black', 'dark', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Hull': [['#d4002a', 'Hull Red', 'main', 1], ['#1d1d1b', 'Black', 'dark', 2], ['#ffffff', 'White', 'light', 3]],
    'Imperial College London': [['#0000ce', 'Imperial Navy', 'main', 1], ['#00b3e3', 'Imperial Light Blue', 'secondary', 2], ['#ffffff', 'White', 'light', 3], ['#d4145a', 'Pink', 'accent', 4]],
    'Keele University': [['#003c76', 'Keele Blue', 'main', 1], ['#c8a000', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Kent': [['#012169', 'Kent Blue', 'main', 1], ['#c8a800', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    "King's College London": [['#6f1635', 'Kings Burgundy', 'main', 1], ['#c8a800', 'Gold', 'secondary', 2], ['#1a1a1a', 'Black', 'dark', 3], ['#ffffff', 'White', 'light', 4]],
    'Kingston University': [['#d4002a', 'Kingston Red', 'main', 1], ['#1d1d1b', 'Black', 'dark', 2], ['#ffffff', 'White', 'light', 3]],
    'Lancaster University': [['#c8102e', 'Lancaster Red', 'main', 1], ['#231f20', 'Black', 'dark', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Law': [['#003865', 'Law Blue', 'main', 1], ['#c8a800', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Leeds': [['#003865', 'Leeds Navy', 'main', 1], ['#c8a327', 'Leeds Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'Leeds Arts University': [['#1a1a1a', 'Black', 'main', 1], ['#e4002b', 'Red', 'secondary', 2], ['#f5f5f5', 'Light Grey', 'accent', 3]],
    'Leeds Beckett University': [['#003865', 'LBU Navy', 'main', 1], ['#c8a000', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'Leeds Trinity University': [['#003865', 'LTU Navy', 'main', 1], ['#c8a000', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Leicester': [['#003e74', 'Leicester Blue', 'main', 1], ['#c8a800', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Lincoln': [['#c8102e', 'Lincoln Red', 'main', 1], ['#231f20', 'Black', 'dark', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Liverpool': [['#003865', 'Liverpool Navy', 'main', 1], ['#c8a327', 'Liverpool Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'Liverpool Hope University': [['#003865', 'Hope Navy', 'main', 1], ['#c8a000', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'Liverpool John Moores University': [['#006272', 'LJMU Teal', 'main', 1], ['#ffffff', 'White', 'light', 2], ['#1a1a1a', 'Dark', 'dark', 3]],
    'London Metropolitan University': [['#005eb8', 'LMU Blue', 'main', 1], ['#e4007c', 'Pink', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'London School of Economics': [['#c8102e', 'LSE Red', 'main', 1], ['#231f20', 'Black', 'dark', 2], ['#ffffff', 'White', 'light', 3]],
    'London School of Hygiene and Tropical Medicine': [['#00445e', 'LSHTM Blue', 'main', 1], ['#c8a000', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'London South Bank University': [['#c8102e', 'LSBU Red', 'main', 1], ['#231f20', 'Black', 'dark', 2], ['#ffffff', 'White', 'light', 3]],
    'Loughborough University': [['#6f2383', 'Lboro Purple', 'main', 1], ['#ffffff', 'White', 'light', 2], ['#1a1a1a', 'Black', 'dark', 3]],
    'University of Manchester': [['#660099', 'Manchester Purple', 'main', 1], ['#f5a623', 'Yellow', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'Manchester Metropolitan University': [['#742082', 'MMU Purple', 'main', 1], ['#ffe600', 'Yellow', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'Middlesex University': [['#d4293b', 'MDX Red', 'main', 1], ['#003865', 'Navy', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'Newcastle University': [['#000000', 'Black', 'main', 1], ['#c8a327', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'Newman University': [['#003865', 'Newman Navy', 'main', 1], ['#c8a000', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Northampton': [['#741fa3', 'Northampton Purple', 'main', 1], ['#ffffff', 'White', 'light', 2], ['#1a1a1a', 'Dark', 'dark', 3]],
    'Northumbria University': [['#003865', 'Northumbria Navy', 'main', 1], ['#009c8f', 'Teal', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'Norwich University of the Arts': [['#1a1a1a', 'Black', 'main', 1], ['#e4002b', 'Red', 'secondary', 2], ['#f5f5f5', 'Light Grey', 'accent', 3]],
    'University of Nottingham': [['#001e62', 'Nottingham Navy', 'main', 1], ['#0082b4', 'Nottingham Blue', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'Nottingham Trent University': [['#002147', 'NTU Navy', 'main', 1], ['#e4002b', 'Red', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'Open University': [['#002147', 'OU Navy', 'main', 1], ['#0082b4', 'OU Blue', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Oxford': [['#002147', 'Oxford Blue', 'main', 1], ['#be0000', 'Oxford Red', 'secondary', 2], ['#c8a327', 'Gold', 'accent', 3], ['#ffffff', 'White', 'light', 4]],
    'Oxford Brookes University': [['#c8102e', 'Brookes Red', 'main', 1], ['#231f20', 'Black', 'dark', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Plymouth': [['#007a3d', 'Plymouth Green', 'main', 1], ['#1c3c6e', 'Navy', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Portsmouth': [['#003e74', 'Portsmouth Blue', 'main', 1], ['#c8a800', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'Queen Margaret University': [['#c8102e', 'QMU Red', 'main', 1], ['#231f20', 'Black', 'dark', 2], ['#ffffff', 'White', 'light', 3]],
    'Queen Mary University of London': [['#003865', 'QMUL Navy', 'main', 1], ['#c8a327', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    "Queen's University Belfast": [['#c8102e', 'QUB Red', 'main', 1], ['#231f20', 'Black', 'dark', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Reading': [['#1d4696', 'Reading Blue', 'main', 1], ['#c8a800', 'Reading Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    "Regent's University London": [['#1a1a54', 'Regents Dark Blue', 'main', 1], ['#c8a800', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'Robert Gordon University': [['#003865', 'RGU Navy', 'main', 1], ['#c8a327', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Roehampton': [['#003865', 'Roehampton Navy', 'main', 1], ['#e4002b', 'Red', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'Royal Agricultural University': [['#004b29', 'RAU Green', 'main', 1], ['#c8a800', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'Royal Holloway University of London': [['#002147', 'RHUL Navy', 'main', 1], ['#c8a327', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'Royal Veterinary College': [['#003865', 'RVC Navy', 'main', 1], ['#c8a000', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Salford': [['#e4002b', 'Salford Red', 'main', 1], ['#1d1d1b', 'Black', 'dark', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Sheffield': [['#002147', 'Sheffield Navy', 'main', 1], ['#009c8f', 'Sheffield Teal', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'Sheffield Hallam University': [['#7d0057', 'SHU Purple', 'main', 1], ['#ffffff', 'White', 'light', 2], ['#1d1d1b', 'Black', 'dark', 3]],
    'SOAS University of London': [['#003865', 'SOAS Navy', 'main', 1], ['#c8a327', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'Solent University': [['#004b87', 'Solent Blue', 'main', 1], ['#e4002b', 'Red', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of South Wales': [['#003865', 'USW Navy', 'main', 1], ['#e4002b', 'Red', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Southampton': [['#003865', 'Southampton Navy', 'main', 1], ['#005eb8', 'Light Blue', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of St Andrews': [['#001e62', 'St Andrews Navy', 'main', 1], ['#c8a800', 'St Andrews Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    "St George's University of London": [['#003865', 'StG Navy', 'main', 1], ['#c8a000', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    "St Mary's University Twickenham": [['#003865', 'StM Navy', 'main', 1], ['#c8a000', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'Staffordshire University': [['#d4002a', 'Staffs Red', 'main', 1], ['#1d1d1b', 'Black', 'dark', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Stirling': [['#1d2a57', 'Stirling Navy', 'main', 1], ['#c8a327', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Strathclyde': [['#003865', 'Strathclyde Navy', 'main', 1], ['#c8a327', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Suffolk': [['#005eb8', 'Suffolk Blue', 'main', 1], ['#e4007c', 'Pink', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Sunderland': [['#d4002a', 'Sunderland Red', 'main', 1], ['#1d1d1b', 'Black', 'dark', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Surrey': [['#003865', 'Surrey Navy', 'main', 1], ['#009c8f', 'Teal', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Sussex': [['#003865', 'Sussex Navy', 'main', 1], ['#c8a327', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'Swansea University': [['#002244', 'Swansea Dark Navy', 'main', 1], ['#c8a327', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'Teesside University': [['#d4002a', 'Teesside Red', 'main', 1], ['#1d1d1b', 'Black', 'dark', 2], ['#ffffff', 'White', 'light', 3]],
    'Ulster University': [['#002147', 'Ulster Navy', 'main', 1], ['#c8a000', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University College London': [['#002147', 'UCL Dark Blue', 'main', 1], ['#d4145a', 'UCL Pink', 'secondary', 2], ['#ffffff', 'White', 'light', 3], ['#f5c400', 'Yellow', 'accent', 4]],
    'University of the Arts London': [['#1a1a1a', 'Black', 'main', 1], ['#e4002b', 'Red', 'secondary', 2], ['#f5f5f5', 'Light Grey', 'accent', 3]],
    'University of Warwick': [['#4b0082', 'Warwick Purple', 'main', 1], ['#c8a327', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of West London': [['#003865', 'UWL Navy', 'main', 1], ['#c8a000', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of the West of England': [['#003865', 'UWE Navy', 'main', 1], ['#009faf', 'Teal', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of the West of Scotland': [['#003865', 'UWS Navy', 'main', 1], ['#c8a000', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Westminster': [['#c8102e', 'Westminster Red', 'main', 1], ['#231f20', 'Black', 'dark', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Winchester': [['#003865', 'Winchester Navy', 'main', 1], ['#c8a000', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Wolverhampton': [['#c8102e', 'Wolves Red', 'main', 1], ['#231f20', 'Black', 'dark', 2], ['#ffffff', 'White', 'light', 3]],
    'University of Worcester': [['#c8102e', 'Worcester Red', 'main', 1], ['#231f20', 'Black', 'dark', 2], ['#ffffff', 'White', 'light', 3]],
    'Wrexham University': [['#003865', 'Wrexham Navy', 'main', 1], ['#e4002b', 'Red', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'University of York': [['#003865', 'York Navy', 'main', 1], ['#c8a327', 'York Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'York St John University': [['#003865', 'YSJ Navy', 'main', 1], ['#c8a000', 'Gold', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    // Norwegian Universities
    'UiB': [['#D03C3A', 'UiB Red', 'main', 1], ['#071726', 'UiB Black Pearl', 'dark', 2], ['#FFFFFF', 'White', 'light', 3]],
    'Universitetet i Bergen': [['#D03C3A', 'UiB Red', 'main', 1], ['#071726', 'UiB Black Pearl', 'dark', 2], ['#FFFFFF', 'White', 'light', 3]],
    'NTNU': [['#00509e', 'NTNU Blue', 'main', 1], ['#adb1b8', 'NTNU Silver', 'secondary', 2], ['#ffffff', 'White', 'light', 3]],
    'UiO': [['#ff0000', 'UiO Red', 'main', 1], ['#000000', 'Black', 'dark', 2], ['#ffffff', 'White', 'light', 3]],
    'Universitetet i Oslo': [['#ff0000', 'UiO Red', 'main', 1], ['#000000', 'Black', 'dark', 2], ['#ffffff', 'White', 'light', 3]],
};

const DEFAULT = [
    ['#003865', 'Navy', 'main', 1],
    ['#c8a327', 'Gold', 'secondary', 2],
    ['#ffffff', 'White', 'light', 3],
];

async function exists(p) {
    try { await access(p); return true; } catch { return false; }
}

async function main() {
    const roots = ['uk-universities', 'norske-universiteter', 'universities'];
    let written = 0;

    console.log(`\n🎨 Writing brand colour palettes...\n`);

    for (const root of roots) {
        const rootPath = join(__dirname, '..', 'public', root);
        if (!(await exists(rootPath))) continue;
        
        const dirs = await readdir(rootPath);
        for (const name of dirs) {
            if (name.startsWith('.')) continue;
            const colorsDir = join(rootPath, name, 'colors');
            await mkdir(colorsDir, { recursive: true });

            const colors = PALETTES[name] ?? DEFAULT;

            const palette = {
                university: name,
                colors: colors.map(([hex, colorName, role, weight]) => ({
                    hex,
                    name: colorName,
                    role,   // main | secondary | accent | dark | light | neutral
                    weight  // 1 = most prominent brand colour
                }))
            };

            const outPath = join(colorsDir, 'palette.json');
            await writeFile(outPath, JSON.stringify(palette, null, 2));
            const flag = PALETTES[name] ? '✅' : '⚪';
            console.log(`${flag} [${root}] ${name}`);
            written++;
        }
    }

    console.log(`\n─────────────────────────────────────────`);
    console.log(`✅ Wrote palettes for ${written} universities`);
    console.log(`\nFormat: colors/palette.json → { university, colors: [{ hex, name, role, weight }] }`);
}

main().catch(console.error);
