require 'dialect_reverser'
require 'rails_helper'

describe DialectReverser do
  let :dialect_reverser {DialectReverser.new(JSLibFigure.test_dialect)}

  it '#reverse' do
    expect(dialect_reverser.reverse('first lark lark almond gentlespoon')).to eq('first gentlespoon gentlespoon allemande gentlespoon')
  end

  it '#check_one_to_one' do
    raise 'implement me'
  end

  it '#make_regexp' do
    dialect = {'dancers' => {'ladles' => 'ravens'}, 'moves' => {'slice' => 'y*arn'}} # y*arn ensures regexp is properly escaped
    re = DialectReverser.new(dialect).send(:make_regexp)
    expect(re).to eq(/ravens|y\*arn/i)
  end


  it '#make_inverted_hash' do
    expected = {'form a short wavy line' => 'form an ocean wave',
                'do si do left shoulder' => 'see saw',
                'second raven' => 'second ladle',
                'second lark' => 'second gentlespoon',
                'first raven' => 'first ladle',
                'first lark' => 'first gentlespoon',
                'ravens' => 'ladles',
                'almond' => 'allemande',
                'raven' => 'ladle',
                'larks' => 'gentlespoons',
                'darcy' => 'gyre',
                'lark' => 'gentlespoon'}
    # use to_s to enforce hash order:
    expect(dialect_reverser.send(:make_inverted_hash).to_s).to eq(expected.to_s)
  end
end
