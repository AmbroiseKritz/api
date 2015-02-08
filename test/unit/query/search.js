
var generate = require('../../../query/search');

module.exports.tests = {};

module.exports.tests.interface = function(test, common) {
  test('valid interface', function(t) {
    t.equal(typeof generate, 'function', 'valid function');
    t.end();
  });
};

var sort = [
  '_score',
  {
    '_script': {
      'script': 'if (doc.containsKey(\'population\')) { return doc[\'population\'].value } else { return 0 }',
      'type': 'number',
      'order': 'desc'
    }
  },
  {
    '_script': {
      'params': {
        'weights': {
          'geoname': 0,
          'address': 4,
          'osmnode': 6,
          'osmway': 6,
          'poi-address': 8,
          'neighborhood': 10,
          'local_admin': 12,
          'locality': 12,
          'admin2': 12,
          'admin1': 14,
          'admin0': 2
        }
      },
      'script': 'if (doc.containsKey(\'_type\')) { '+
                'type=doc[\'_type\'].value; '+
                'return ( type in weights ) ? weights[ type ] : 0 }'+
                'else { return 0 }',
      'type': 'number',
      'order': 'desc'
    }
  }
];

module.exports.tests.query = function(test, common) {
  test('valid query', function(t) {
    var query = generate({
      input: 'test', size: 10,
      lat: 29.49136, lon: -82.50622,
      bbox: {
        top: 47.47, 
        right: -61.84, 
        bottom: 11.51, 
        left: -103.16
      },
      layers: ['test']
    });

    var expected = {
      'query': {
        'filtered': {
          'query': {
            'query_string': {
              'query': 'test',
              'fields': [
                'name.default'
              ],
              'default_operator': 'OR'
            }
          },
          'filter': {
            'bool': {
              'must': [
                {
                  'geo_bounding_box': {
                    'center_point': {
                      'top': '47.47',
                      'right': '-61.84',
                      'bottom':'11.51',
                      'left': '-103.16'
                    },
                    '_cache': true
                  }
                }
              ]
            }
          }
        }
      },
      'sort': sort,
      'size': 10,
      'track_scores': true
    };

    t.deepEqual(query, expected, 'valid search query');
    t.end();
  });

  test('valid query without lat/lon', function(t) {
    var query = generate({
      input: 'test', size: 10,
      bbox: {
        top: 47.47, 
        right: -61.84, 
        bottom: 11.51, 
        left: -103.16
      },
      layers: ['test']
    });

    var expected = {
      'query': {
        'filtered': {
          'query': {
            'query_string': {
              'query': 'test',
              'fields': [
                'name.default'
              ],
              'default_operator': 'OR'
            }
          },
          'filter': {
            'bool': {
              'must': [
                {
                  'geo_bounding_box': {
                    'center_point': {
                      'top': '47.47',
                      'right': '-61.84',
                      'bottom':'11.51',
                      'left': '-103.16'
                    },
                    '_cache': true
                  }
                }
              ]
            }
          }
        }
      },
      'sort': sort,
      'size': 10,
      'track_scores': true
    };
    
    t.deepEqual(query, expected, 'valid search query');
    t.end();
  });

  test('valid query with no lat/lon and no bbox', function(t) {
    var query = generate({
      input: 'test', size: 10,
      layers: ['test']
    });

    var expected = {
      'query': {
        'filtered': {
          'query': {
            'query_string': {
              'query': 'test',
              'fields': [
                'name.default'
              ],
              'default_operator': 'OR'
            }
          },
          'filter': {
            'bool': {
              'must': []
            }
          }
        }
      },
      'size': 10,
      'sort': sort,
      'track_scores': true
    };
    
    t.deepEqual(query, expected, 'valid search query');
    t.end();
  });

  test('valid query without bbox', function(t) {
    var query = generate({
      input: 'test', size: 10,
      lat: 29.49136, lon: -82.50622,
      layers: ['test']
    });

    var expected = {
      'query': {
        'filtered': {
          'query': {
            'query_string': {
              'query': 'test',
              'fields': [
                'name.default'
              ],
              'default_operator': 'OR'
            }
          },
          'filter': {
            'bool': {
              'must': [
                {
                  'geo_distance': {
                    'distance': '50km',
                    'distance_type': 'plane',
                    'optimize_bbox': 'indexed',
                    '_cache': true,
                    'center_point': {
                      'lat': '29.49',
                      'lon': '-82.51'
                    }
                  }
                }
              ]
            }
           }
        }
      },
      'sort': [
        '_score',
        {
          '_geo_distance': {
            'center_point': {
              'lat': 29.49136,
              'lon': -82.50622
            },
            'order': 'asc',
            'unit': 'km'
          }
        }
      ].concat(sort.slice(1)),
      'size': 10,
      'track_scores': true
    };

    t.deepEqual(query, expected, 'valid search query');
    t.end();
  });
};

module.exports.all = function (tape, common) {

  function test(name, testFunction) {
    return tape('search query ' + name, testFunction);
  }

  for( var testCase in module.exports.tests ){
    module.exports.tests[testCase](test, common);
  }
};